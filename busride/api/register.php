<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';

require_method('POST');
$in = read_json();

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

$pdo = db();

$check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) {
    json_out(['error' => 'An account with this email already exists.'], 409);
}

// Public sign-up always creates a normal user. Admins are made with database/create_admin.php.
$hash = password_hash($password, PASSWORD_DEFAULT);
$ins  = $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')");
$ins->execute([$name, $email, $hash]);

$user = ['id' => (int) $pdo->lastInsertId(), 'name' => $name, 'email' => $email, 'role' => 'user'];
login_user($user);

json_out(['user' => $user], 201);
