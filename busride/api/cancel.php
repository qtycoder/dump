<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';

require_method('POST');
$user = require_login();
$in   = read_json();
$id   = (int) ($in['booking_id'] ?? 0);

$pdo = db();
$pdo->beginTransaction();
try {
    $s = $pdo->prepare("
      SELECT k.id, k.status, (t.depart_at > NOW() + INTERVAL 2 HOUR) AS can_cancel
        FROM bookings k
        JOIN trips t ON t.id = k.trip_id
       WHERE k.id = ? AND k.user_id = ?
         FOR UPDATE");
    $s->execute([$id, $user['id']]);
    $row = $s->fetch();

    if (!$row) {
        $pdo->rollBack();
        json_out(['error' => 'Booking not found.'], 404);
    }
    if ($row['status'] === 'cancelled') {
        $pdo->rollBack();
        json_out(['error' => 'This booking is already cancelled.'], 409);
    }
    if (!(int) $row['can_cancel']) {
        $pdo->rollBack();
        json_out(['error' => 'Bookings can only be cancelled up to 2 hours before departure.'], 409);
    }

    // A paid booking is marked refunded (demo payments only: no real money moves).
    $pdo->prepare("
      UPDATE bookings
         SET status = 'cancelled',
             payment_status = IF(payment_status = 'paid', 'refunded', payment_status)
       WHERE id = ?")->execute([$id]);

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Cancel failed: ' . $e->getMessage());
    json_out(['error' => 'Could not cancel the booking. Please try again.'], 500);
}

json_out(['ok' => true]);
