<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bookings.php';

require_method('POST');
$user = require_login();
$in   = read_json();

$tripId   = (int) ($in['trip_id'] ?? 0);
$seat     = (int) ($in['seat_no'] ?? 0);
$fareCode = (string) ($in['fare_type'] ?? '');
$method   = (string) ($in['payment_method'] ?? '');
$name     = trim((string) ($in['passenger_name'] ?? ''));
$idAck    = !empty($in['id_ack']);
$phone    = preg_replace('/[\s\-()]/', '', (string) ($in['contact_phone'] ?? ''));

if (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
    json_out(['error' => 'Enter the passenger name (2 to 80 characters).'], 422);
}
// Philippine mobile number: 09XXXXXXXXX, 639XXXXXXXXX or +639XXXXXXXXX
if (!preg_match('/^(?:\+?63|0)9\d{9}$/', $phone)) {
    json_out(['error' => 'Enter a valid mobile number, for example 09171234567.'], 422);
}
if (!in_array($method, ['cash', 'gcash', 'maya'], true)) {
    json_out(['error' => 'Choose a payment method.'], 422);
}
if ($tripId < 1 || $seat < 1) {
    json_out(['error' => 'Choose a trip and a seat.'], 422);
}

$pdo = db();

$ft = $pdo->prepare('SELECT discount_pct FROM fare_types WHERE code = ?');
$ft->execute([$fareCode]);
$discount = $ft->fetchColumn();
if ($discount === false) {
    json_out(['error' => 'Choose a fare type.'], 422);
}
$discount = (int) $discount;
if ($discount > 0 && !$idAck) {
    json_out(['error' => 'Please confirm that you will show a valid ID when boarding.'], 422);
}

$pdo->beginTransaction();
try {
    // Lock the trip so two people cannot book the last seats at the same moment.
    $s = $pdo->prepare("
      SELECT t.id, t.status, (t.depart_at > NOW()) AS open_for_sale, r.base_fare, m.capacity
        FROM trips t
        JOIN routes r     ON r.id = t.route_id
        JOIN buses b      ON b.id = t.bus_id
        JOIN bus_models m ON m.id = b.model_id
       WHERE t.id = ? AND b.status = 'active'
         FOR UPDATE");
    $s->execute([$tripId]);
    $trip = $s->fetch();

    if (!$trip || $trip['status'] !== 'scheduled' || !(int) $trip['open_for_sale']) {
        $pdo->rollBack();
        json_out(['error' => 'This trip is no longer open for booking.'], 409);
    }
    if ($seat > (int) $trip['capacity']) {
        $pdo->rollBack();
        json_out(['error' => 'That seat does not exist on this bus.'], 422);
    }

    // The price is always computed here, never taken from the browser.
    $amount        = fare_for((float) $trip['base_fare'], $discount);
    $paymentStatus = $method === 'cash' ? 'unpaid' : 'paid';
    $reference     = $method === 'cash' ? null : 'DEMO-' . random_code(8);

    $ins = $pdo->prepare("
      INSERT INTO bookings (code, user_id, trip_id, seat_no, passenger_name, contact_phone, fare_type, amount,
                            payment_method, payment_status, reference_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $bookingId = 0;
    for ($attempt = 0; $attempt < 5 && !$bookingId; $attempt++) {
        try {
            $ins->execute([
                random_code(10), $user['id'], $tripId, $seat, $name, $phone, $fareCode, $amount,
                $method, $paymentStatus, $reference,
            ]);
            $bookingId = (int) $pdo->lastInsertId();
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            if (($e->errorInfo[1] ?? 0) === 1062 && strpos($msg, 'uq_active_seat') !== false) {
                $pdo->rollBack();
                json_out(['error' => "Seat $seat was just taken. Please pick another seat."], 409);
            }
            if (($e->errorInfo[1] ?? 0) === 1062 && strpos($msg, 'uq_booking_code') !== false) {
                continue;   // extremely rare code clash: try a new code
            }
            throw $e;
        }
    }
    if (!$bookingId) {
        throw new RuntimeException('Could not generate a ticket code.');
    }

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Booking failed: ' . $e->getMessage());
    json_out(['error' => 'Something went wrong while booking. Please try again.'], 500);
}

$booking = load_bookings($user['id'], $bookingId)[0] ?? null;
json_out(['booking' => $booking, 'demo_payment' => $method !== 'cash'], 201);
