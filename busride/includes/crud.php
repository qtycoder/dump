<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function crud_entities(): array
{
    static $defs = null;
    return $defs ??= require __DIR__ . '/entities.php';
}

function crud_entity(string $name): array
{
    $defs = crud_entities();
    if (!isset($defs[$name])) {
        json_out(['error' => 'Unknown section.'], 404);
    }
    return $defs[$name];
}

function crud_sql(string $sql, string $alias): string
{
    return str_replace('{t}', $alias, $sql);
}

// What the browser needs to draw the tables and forms (no SQL leaves the server).
function crud_meta(): array
{
    $out = [];
    foreach (crud_entities() as $key => $e) {
        $fields = [];
        foreach ($e['fields'] as $name => $f) {
            $fields[$name] = array_intersect_key($f, array_flip(
                ['type', 'label', 'ro', 'options', 'ref', 'min', 'max', 'decimal', 'optional', 'create_only']
            ));
        }
        $extra = [];
        foreach ($e['extra'] ?? [] as $alias => $x) {
            $extra[$alias] = ['label' => $x['label']];
        }
        $out[] = [
            'key' => $key, 'label' => $e['label'], 'pk' => $e['pk'],
            'actions' => $e['actions'], 'fields' => $fields, 'extra' => $extra, 'list' => $e['list'],
        ];
    }
    return $out;
}

function crud_list(string $entityName): array
{
    $defs = crud_entities();
    $e  = crud_entity($entityName);
    $pk = $e['pk'];

    $select = ["t.`$pk` AS `$pk`"];
    $joins  = [];
    $i = 0;
    foreach ($e['fields'] as $name => $f) {
        if (!empty($f['virtual'])) {      // not a real column (e.g. the password box)
            continue;
        }
        $select[] = "t.`$name` AS `$name`";
        if ($f['type'] === 'ref') {
            $ref   = $defs[$f['ref']];
            $alias = 'j' . $i++;
            $select[] = crud_sql($ref['label_sql'], $alias) . " AS `{$name}__label`";
            $joins[]  = "LEFT JOIN `{$ref['table']}` $alias ON $alias.`{$ref['pk']}` = t.`$name`";
        }
    }
    foreach ($e['extra'] ?? [] as $alias => $x) {
        $select[] = crud_sql($x['sql'], 't') . " AS `$alias`";
    }

    $sql = 'SELECT ' . implode(', ', $select) . " FROM `{$e['table']}` t "
         . implode(' ', $joins) . ' ORDER BY ' . crud_sql($e['order'], 't') . ' LIMIT 500';

    return db()->query($sql)->fetchAll();
}

function crud_options(string $entityName): array
{
    $e = crud_entity($entityName);
    $sql = 'SELECT t.`' . $e['pk'] . '` AS id, ' . crud_sql($e['label_sql'], 't') . ' AS label'
         . " FROM `{$e['table']}` t ORDER BY " . crud_sql($e['order'], 't') . ' LIMIT 500';
    return db()->query($sql)->fetchAll();
}

// Validate input against the entity definition. Returns [column => value].
function crud_clean(array $e, array $data, bool $creating): array
{
    $clean = [];
    foreach ($e['fields'] as $name => $f) {
        if (!empty($f['ro'])) {
            continue;
        }
        if (!$creating && !empty($f['create_only'])) {
            continue;
        }
        if (!$creating && !array_key_exists($name, $data)) {
            continue;
        }
        $label    = $f['label'];
        $raw      = $data[$name] ?? '';
        $optional = !empty($f['optional']);
        $fail     = static function (string $msg) {
            json_out(['error' => $msg], 422);
        };

        if ($f['type'] === 'password') {      // hashed; blank on edit means keep the old one
            $pw = is_string($raw) ? $raw : '';
            if ($pw === '') {
                if ($creating) {
                    $fail("$label is required.");
                }
                continue;
            }
            if (strlen($pw) < 8 || strlen($pw) > 72) {
                $fail("$label must be 8 to 72 characters.");
            }
            $clean[$f['column'] ?? $name] = password_hash($pw, PASSWORD_DEFAULT);
            continue;
        }

        if ($f['type'] === 'bool') {
            $clean[$name] = filter_var($raw, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            continue;
        }

        $str = is_scalar($raw) ? trim((string) $raw) : '';
        if ($str === '') {
            if ($optional) {
                $clean[$name] = $f['type'] === 'text' ? '' : null;
                continue;
            }
            $fail("$label is required.");
        }

        switch ($f['type']) {
            case 'text':
                if (mb_strlen($str) > ($f['max'] ?? 255)) {
                    $fail("$label is too long.");
                }
                $clean[$name] = $str;
                break;

            case 'number':
                if (!empty($f['decimal'])) {
                    if (!is_numeric($str)) {
                        $fail("$label must be a number.");
                    }
                    $num = (float) $str;
                } else {
                    if (filter_var($str, FILTER_VALIDATE_INT) === false) {
                        $fail("$label must be a whole number.");
                    }
                    $num = (int) $str;
                }
                if (isset($f['min']) && $num < $f['min']) {
                    $fail("$label must be at least {$f['min']}.");
                }
                if (isset($f['max']) && $num > $f['max']) {
                    $fail("$label must be at most {$f['max']}.");
                }
                $clean[$name] = $num;
                break;

            case 'select':
                if (!in_array($str, $f['options'], true)) {
                    $fail("$label has an invalid value.");
                }
                $clean[$name] = $str;
                break;

            case 'date':
                if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $str, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
                    $fail("$label must be a valid date.");
                }
                $clean[$name] = $str;
                break;

            case 'datetime':
                if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?$/', $str, $m)
                    || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])
                    || (int) $m[4] > 23 || (int) $m[5] > 59) {
                    $fail("$label must be a valid date and time.");
                }
                $clean[$name] = "{$m[1]}-{$m[2]}-{$m[3]} {$m[4]}:{$m[5]}:00";
                break;

            case 'email':
                $str = strtolower($str);
                if (!filter_var($str, FILTER_VALIDATE_EMAIL) || strlen($str) > ($f['max'] ?? 190)) {
                    $fail("$label is not a valid email address.");
                }
                $clean[$name] = $str;
                break;

            case 'color':
                if (!preg_match('/^#[0-9a-fA-F]{6}$/', $str)) {
                    $fail("$label must look like #2fd6c8.");
                }
                $clean[$name] = strtolower($str);
                break;

            case 'ref':
                if (filter_var($str, FILTER_VALIDATE_INT) === false || (int) $str < 1) {
                    $fail("Choose a value for $label.");
                }
                $clean[$name] = (int) $str;
                break;
        }
    }
    return $clean;
}

function crud_db_error(PDOException $e): void
{
    $code = (int) ($e->errorInfo[1] ?? 0);
    if ($code === 1451) {
        json_out(['error' => "This record is used by other records, so it can't be deleted."], 409);
    }
    if ($code === 1452) {
        json_out(['error' => 'One of the selected records does not exist.'], 422);
    }
    if ($code === 1062) {
        json_out(['error' => 'That value already exists or is already taken.'], 409);
    }
    error_log('Admin CRUD error: ' . $e->getMessage());
    json_out(['error' => 'The database rejected that change.'], 500);
}
