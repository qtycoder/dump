<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';

require_method('GET');

$rows = db()
    ->query('SELECT id, title, description, source FROM ref_items ORDER BY id DESC LIMIT 50')
    ->fetchAll();

json_out(['items' => $rows]);
