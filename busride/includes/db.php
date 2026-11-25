<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $c = require __DIR__ . '/../config/config.php';
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $c['db_host'], $c['db_port'], $c['db_name'], $c['db_charset']
    );
    $tz = preg_match('/^[+-]\d{2}:\d{2}$/', (string) ($c['db_timezone'] ?? '')) ? $c['db_timezone'] : '+08:00';

    try {
        $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '" . $tz . "'",
        ]);
    } catch (PDOException $e) {
        error_log('DB connect failed: ' . $e->getMessage());
        json_out(['error' => 'Cannot connect to the database. Check config/config.php.'], 500);
    }

    return $pdo;
}
