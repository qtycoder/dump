<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';

require_method('POST');
start_session();

// Simple limit: 5 wrong attempts per 5 minutes per session.
$now = time();
$_SESSION['fails'] = array_values(array_filter(
    $_SESSION['fails'] ?? [],
    static fn($t) => $t > $now - 300
));
if (count($_SESSION['fails']) >= 5) {
    json_out(['error' => 'Too many attempts. Please wait a few minutes.'], 429);
}

$in       = read_json();
$email    = strtolower(trim((string) ($in['email'] ?? '')));
$password = (string) ($in['password'] ?? '');

if ($email === '' || $password === '') {
    json_out(['error' => 'Enter your email and password.'], 422);
}

$stmt = db()->prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$row = $stmt->fetch();

if (!$row || !password_verify($password, $row['password_hash'])) {
    $_SESSION['fails'][] = $now;
    json_out(['error' => 'Wrong email or password.'], 401);
}

$_SESSION['fails'] = [];
login_user($row);

json_out(['user' => [
    'id' => (int) $row['id'], 'name' => $row['name'], 'email' => $row['email'], 'role' => $row['role'],
]]);
