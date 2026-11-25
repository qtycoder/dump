<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';

require_method('POST');
$in = read_json();

$name     = trim((string) ($in['name'] ?? ''));
$email    = strtolower(trim((string) ($in['email'] ?? '')));
$password = (string) ($in['password'] ?? '');

if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
    json_out(['error' => 'Ang pangalan ay dapat 2 hanggang 60 letra.'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
    json_out(['error' => 'Hindi valid ang email address.'], 422);
}
if (strlen($password) < 8 || strlen($password) > 72) {
    json_out(['error' => 'Ang password ay dapat 8 hanggang 72 characters.'], 422);
}

$pdo = db();

$check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) {
    json_out(['error' => 'May account na gamit ang email na ito.'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$ins  = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
$ins->execute([$name, $email, $hash]);

$user = ['id' => (int) $pdo->lastInsertId(), 'name' => $name, 'email' => $email];
login_user($user);

json_out(['user' => $user], 201);
