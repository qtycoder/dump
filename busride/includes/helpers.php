<?php
declare(strict_types=1);

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => !empty($_SERVER['HTTPS']),
    ]);
    session_name('busride_sid');
    session_start();
}

function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        json_out(['error' => 'Method not allowed'], 405);
    }
}

// Accepts JSON bodies only. A cross-site <form> cannot send this content type,
// so it also works as CSRF protection together with the SameSite cookie.
function read_json(): array
{
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== 0) {
        json_out(['error' => 'Invalid request'], 415);
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw === false ? '' : $raw, true);
    if (!is_array($data)) {
        json_out(['error' => 'Invalid request'], 400);
    }
    return $data;
}

function current_user(): ?array
{
    start_session();
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    return [
        'id'    => (int) $_SESSION['user_id'],
        'name'  => (string) ($_SESSION['user_name'] ?? ''),
        'email' => (string) ($_SESSION['user_email'] ?? ''),
        'role'  => (string) ($_SESSION['user_role'] ?? 'user'),
    ];
}

function login_user(array $user): void
{
    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id']    = (int) $user['id'];
    $_SESSION['user_name']  = (string) $user['name'];
    $_SESSION['user_email'] = (string) $user['email'];
    $_SESSION['user_role']  = (string) ($user['role'] ?? 'user');
}

function require_login(): array
{
    $u = current_user();
    if (!$u) {
        json_out(['error' => 'Please log in first.'], 401);
    }
    return $u;
}

// The role is read from the database on every admin request, so demoting an
// admin takes effect immediately instead of waiting for their session to end.
function require_admin(): array
{
    $u = require_login();
    $stmt = db()->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$u['id']]);
    $role = $stmt->fetchColumn();
    if ($role !== 'admin') {
        json_out(['error' => 'Admins only.'], 403);
    }
    $u['role'] = 'admin';
    return $u;
}

function money(float $v): float
{
    return round($v, 2);
}

// Fare after discount, rounded to centavos.
function fare_for(float $base, int $discountPct): float
{
    return money($base * (100 - $discountPct) / 100);
}

function random_code(int $len): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O/1/I
    $out = '';
    for ($i = 0; $i < $len; $i++) {
        $out .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $out;
}

function mask_license(string $no): string
{
    return strlen($no) <= 6 ? $no : substr($no, 0, 3) . '••••' . substr($no, -3);
}

function initials(string $name): string
{
    $parts = preg_split('/\s+/', trim($name)) ?: [];
    $first = mb_substr($parts[0] ?? '', 0, 1);
    $last  = count($parts) > 1 ? mb_substr($parts[count($parts) - 1], 0, 1) : '';
    return mb_strtoupper($first . $last);
}
