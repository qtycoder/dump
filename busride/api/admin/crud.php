<?php
declare(strict_types=1);

require_once __DIR__ . '/../../includes/crud.php';

$admin  = require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'GET') {
    $name = (string) ($_GET['entity'] ?? '');
    if (isset($_GET['options'])) {
        json_out(['options' => crud_options($name)]);
    }
    json_out(['rows' => crud_list($name)]);
}

require_method('POST');
$in     = read_json();
$name   = (string) ($in['entity'] ?? '');
$action = (string) ($in['action'] ?? '');
$e      = crud_entity($name);
$pk     = $e['pk'];
$id     = (int) ($in['id'] ?? 0);

if (!in_array($action, ['create', 'update', 'delete'], true) || empty($e['actions'][$action])) {
    json_out(['error' => 'That action is not allowed here.'], 403);
}

$pdo = db();

try {
    if ($action === 'create') {
        $data = crud_clean($e, (array) ($in['data'] ?? []), true);
        $cols = array_map(static fn($c) => "`$c`", array_keys($data));
        $sql  = "INSERT INTO `{$e['table']}` (" . implode(', ', $cols) . ') VALUES ('
              . implode(', ', array_fill(0, count($data), '?')) . ')';
        $pdo->prepare($sql)->execute(array_values($data));
        json_out(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
    }

    if ($id < 1) {
        json_out(['error' => 'Missing record.'], 422);
    }

    // Guard rails so an admin can't lock themselves out.
    if ($name === 'users' && $id === $admin['id']) {
        if ($action === 'delete') {
            json_out(['error' => "You can't delete your own account."], 409);
        }
        if (isset($in['data']['role']) && $in['data']['role'] !== 'admin') {
            json_out(['error' => "You can't remove your own admin role."], 409);
        }
    }

    if ($action === 'update') {
        $data = crud_clean($e, (array) ($in['data'] ?? []), false);
        if (!$data) {
            json_out(['error' => 'Nothing to update.'], 422);
        }
        $sets = array_map(static fn($c) => "`$c` = ?", array_keys($data));
        $sql  = "UPDATE `{$e['table']}` SET " . implode(', ', $sets) . " WHERE `$pk` = ?";
        $pdo->prepare($sql)->execute([...array_values($data), $id]);
        json_out(['ok' => true]);
    }

    $pdo->prepare("DELETE FROM `{$e['table']}` WHERE `$pk` = ?")->execute([$id]);
    json_out(['ok' => true]);
} catch (PDOException $ex) {
    crud_db_error($ex);
}
