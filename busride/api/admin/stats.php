<?php
declare(strict_types=1);

require_once __DIR__ . '/../../includes/db.php';

require_method('GET');
require_admin();

$pdo = db();
$one = static fn(string $sql) => $pdo->query($sql)->fetchColumn();

$revenue = (float) $one("SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE status = 'confirmed' AND payment_status = 'paid'");
$cashDue = (float) $one("SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE status = 'confirmed' AND payment_status = 'unpaid'");

$seatsTotal = (int) $one("
  SELECT COALESCE(SUM(m.capacity), 0)
    FROM trips t JOIN buses b ON b.id = t.bus_id JOIN bus_models m ON m.id = b.model_id
   WHERE t.status = 'scheduled' AND t.depart_at > NOW()");
$seatsSold = (int) $one("
  SELECT COUNT(*)
    FROM bookings k JOIN trips t ON t.id = k.trip_id
   WHERE k.status = 'confirmed' AND t.status = 'scheduled' AND t.depart_at > NOW()");

// Paid revenue for each of the last 7 days (days with no sales show 0).
$today = new DateTimeImmutable((string) $one('SELECT CURDATE()'));
$days  = [];
for ($i = 6; $i >= 0; $i--) {
    $days[$today->modify("-$i day")->format('Y-m-d')] = 0.0;
}
$rows = $pdo->query("
  SELECT DATE(created_at) AS d, SUM(amount) AS total
    FROM bookings
   WHERE status = 'confirmed' AND payment_status = 'paid'
     AND created_at >= CURDATE() - INTERVAL 6 DAY
   GROUP BY DATE(created_at)")->fetchAll();
foreach ($rows as $r) {
    if (isset($days[$r['d']])) {
        $days[$r['d']] = (float) $r['total'];
    }
}
$revenue7 = [];
foreach ($days as $d => $total) {
    $revenue7[] = ['date' => $d, 'total' => money($total)];
}

$top = $pdo->query("
  SELECT CONCAT(r.origin, ' → ', r.destination) AS label, COUNT(*) AS bookings
    FROM bookings k
    JOIN trips t  ON t.id = k.trip_id
    JOIN routes r ON r.id = t.route_id
   WHERE k.status = 'confirmed'
   GROUP BY r.id, r.origin, r.destination
   ORDER BY bookings DESC
   LIMIT 5")->fetchAll();

$recent = $pdo->query("
  SELECT k.code, k.passenger_name, k.amount, k.payment_status, k.status, k.created_at,
         CONCAT(r.origin, ' → ', r.destination) AS route
    FROM bookings k
    JOIN trips t  ON t.id = k.trip_id
    JOIN routes r ON r.id = t.route_id
   ORDER BY k.id DESC
   LIMIT 8")->fetchAll();

json_out([
    'totals' => [
        'passengers'      => (int) $one("SELECT COUNT(*) FROM users WHERE role = 'user'"),
        'bookings'        => (int) $one("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'"),
        'bookings_today'  => (int) $one("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND DATE(created_at) = CURDATE()"),
        'upcoming_trips'  => (int) $one("SELECT COUNT(*) FROM trips WHERE status = 'scheduled' AND depart_at > NOW()"),
        'revenue'         => money($revenue),
        'cash_due'        => money($cashDue),
        'occupancy_pct'   => $seatsTotal > 0 ? (int) round($seatsSold * 100 / $seatsTotal) : 0,
        'seats_sold'      => $seatsSold,
        'seats_total'     => $seatsTotal,
    ],
    'revenue_7d' => $revenue7,
    'top_routes' => array_map(static fn($r) => ['label' => $r['label'], 'bookings' => (int) $r['bookings']], $top),
    'recent'     => array_map(static fn($r) => [
        'code' => $r['code'], 'passenger_name' => $r['passenger_name'], 'route' => $r['route'],
        'amount' => (float) $r['amount'], 'payment_status' => $r['payment_status'],
        'status' => $r['status'], 'created_at' => $r['created_at'],
    ], $recent),
]);
