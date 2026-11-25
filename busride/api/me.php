<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';

require_method('GET');

$u = current_user();
if ($u) {
    // Keep the role fresh: it may have been changed by an admin since login.
    $stmt = db()->prepare('SELECT name, role FROM users WHERE id = ?');
    $stmt->execute([$u['id']]);
    $row = $stmt->fetch();
    if (!$row) {            // account was deleted
        start_session();
        $_SESSION = [];
        $u = null;
    } else {
        $u['name'] = $row['name'];
        $u['role'] = $row['role'];
    }
}

json_out(['user' => $u]);
