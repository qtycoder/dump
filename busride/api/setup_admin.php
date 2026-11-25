<?php
declare(strict_types=1);

// One-time "first admin" setup. It only works when BOTH are true:
//   1. the request comes from the same computer (localhost), and
//   2. no admin account exists yet.
// After the first admin is created this endpoint refuses everything.
require_once __DIR__ . '/../includes/db.php';

$local = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
$pdo   = db();
$has   = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn() > 0;
$open  = $local && !$has;

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    json_out(['available' => $open, 'reason' => !$local ? 'not_local' : ($has ? 'admin_exists' : '')]);
}

require_method('POST');
if (!$open) {
    json_out(['error' => 'Setup is closed.'], 403);
}

$in       = read_json();
$name     = trim((string) ($in['name'] ?? ''));
$email    = strtolower(trim((string) ($in['email'] ?? '')));
$password = (string) ($in['password'] ?? '');

if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
    json_out(['error' => 'Name must be 2 to 60 characters.'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
    json_out(['error' => 'That email address is not valid.'], 422);
}
if (strlen($password) < 8 || strlen($password) > 72) {
    json_out(['error' => 'Password must be 8 to 72 characters.'], 422);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$find = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$find->execute([$email]);
$id = $find->fetchColumn();

if ($id) {   // the email already signed up as a passenger: promote it
    $pdo->prepare("UPDATE users SET role = 'admin', name = ?, password_hash = ? WHERE id = ?")->execute([$name, $hash, $id]);
} else {
    $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")->execute([$name, $email, $hash]);
    $id = $pdo->lastInsertId();
}

$user = ['id' => (int) $id, 'name' => $name, 'email' => $email, 'role' => 'admin'];
login_user($user);
json_out(['user' => $user], 201);
