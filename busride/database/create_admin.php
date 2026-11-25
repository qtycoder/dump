<?php
// Usage:  php database/create_admin.php "Full Name" admin@example.com
// Creates an admin (or promotes an existing user and resets their password).
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../includes/db.php';

$name  = trim((string) ($argv[1] ?? ''));
$email = strtolower(trim((string) ($argv[2] ?? '')));

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage: php database/create_admin.php \"Full Name\" admin@example.com\n");
    exit(1);
}

$windows = stripos(PHP_OS, 'WIN') === 0;
echo 'Password (8-72 characters): ';
if (!$windows) {
    shell_exec('stty -echo');
}
$password = rtrim((string) fgets(STDIN), "\r\n");
if (!$windows) {
    shell_exec('stty echo');
    echo "\n";
}

if (strlen($password) < 8 || strlen($password) > 72) {
    fwrite(STDERR, "Password must be 8 to 72 characters.\n");
    exit(1);
}

$pdo  = db();
$hash = password_hash($password, PASSWORD_DEFAULT);

$find = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$find->execute([$email]);

if ($find->fetch()) {
    $pdo->prepare("UPDATE users SET role = 'admin', name = ?, password_hash = ? WHERE email = ?")
        ->execute([$name, $hash, $email]);
    echo "Existing user promoted to admin: $email\n";
} else {
    $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
        ->execute([$name, $email, $hash]);
    echo "Admin created: $email\n";
}
