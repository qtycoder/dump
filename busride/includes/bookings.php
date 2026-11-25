<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

// A passenger's bookings (optionally just one) with the trip details a ticket needs.
function load_bookings(int $userId, ?int $bookingId = null): array
{
    $sql = "
      SELECT k.id, k.code, k.seat_no, k.passenger_name, k.contact_phone, k.fare_type, k.amount,
             k.payment_method, k.payment_status, k.reference_no, k.status, k.created_at,
             f.label AS fare_label,
             t.id AS trip_id, t.depart_at,
             r.origin, r.destination, r.duration_min,
             b.plate_no, m.name AS model_name, d.full_name AS driver_name,
             (t.depart_at > NOW()) AS upcoming,
             (t.depart_at > NOW() + INTERVAL 2 HOUR) AS can_cancel
        FROM bookings k
        JOIN trips t      ON t.id = k.trip_id
        JOIN routes r     ON r.id = t.route_id
        JOIN buses b      ON b.id = t.bus_id
        JOIN bus_models m ON m.id = b.model_id
        JOIN drivers d    ON d.id = t.driver_id
        LEFT JOIN fare_types f ON f.code = k.fare_type
       WHERE k.user_id = ?";
    $params = [$userId];
    if ($bookingId !== null) {
        $sql .= ' AND k.id = ?';
        $params[] = $bookingId;
    }
    $sql .= ' ORDER BY t.depart_at DESC LIMIT 200';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);

    $out = [];
    foreach ($stmt->fetchAll() as $r) {
        $out[] = [
            'id'             => (int) $r['id'],
            'code'           => $r['code'],
            'seat_no'        => (int) $r['seat_no'],
            'passenger_name' => $r['passenger_name'],
            'contact_phone'  => $r['contact_phone'],
            'fare_type'      => $r['fare_type'],
            'fare_label'     => $r['fare_label'] ?? ucfirst((string) $r['fare_type']),
            'amount'         => (float) $r['amount'],
            'payment_method' => $r['payment_method'],
            'payment_status' => $r['payment_status'],
            'reference_no'   => $r['reference_no'],
            'status'         => $r['status'],
            'created_at'     => $r['created_at'],
            'trip_id'        => (int) $r['trip_id'],
            'depart_at'      => $r['depart_at'],
            'origin'         => $r['origin'],
            'destination'    => $r['destination'],
            'duration_min'   => (int) $r['duration_min'],
            'plate_no'       => $r['plate_no'],
            'model_name'     => $r['model_name'],
            'driver_name'    => $r['driver_name'],
            'upcoming'       => (bool) $r['upcoming'],
            'can_cancel'     => $r['status'] === 'confirmed' && (bool) $r['can_cancel'],
        ];
    }
    return $out;
}
