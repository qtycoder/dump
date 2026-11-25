<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/trips.php';

require_method('GET');

// One trip, with the seats that are already taken.
if (isset($_GET['id'])) {
    $id = (int) $_GET['id'];
    $rows = fetch_trips('AND t.id = ?', [$id], 1);
    if (!$rows) {
        json_out(['error' => 'This trip is not available anymore.'], 404);
    }
    $seats = db()->prepare("SELECT seat_no FROM bookings WHERE trip_id = ? AND status <> 'cancelled' ORDER BY seat_no");
    $seats->execute([$id]);
    $trip = $rows[0];
    $trip['taken_seats'] = array_map('intval', $seats->fetchAll(PDO::FETCH_COLUMN));
    json_out(['trip' => $trip]);
}

$where  = '';
$params = [];

if (!empty($_GET['route_id'])) {
    $where   .= ' AND t.route_id = ?';
    $params[] = (int) $_GET['route_id'];
}
if (!empty($_GET['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $_GET['date'])) {
    $where   .= ' AND DATE(t.depart_at) = ?';
    $params[] = (string) $_GET['date'];
}

json_out(['trips' => fetch_trips($where, $params)]);
