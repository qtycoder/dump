<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function all_fare_types(): array
{
    $rows = db()->query('SELECT id, code, label, discount_pct, note FROM fare_types ORDER BY id')->fetchAll();
    foreach ($rows as &$r) {
        $r['id'] = (int) $r['id'];
        $r['discount_pct'] = (int) $r['discount_pct'];
    }
    return $rows;
}

// Upcoming scheduled trips with route, bus, model and driver safety info.
// $extraWhere must be a fixed SQL fragment written in code, never user input;
// user values go in $params.
function fetch_trips(string $extraWhere = '', array $params = [], int $limit = 100): array
{
    $sql = "
      SELECT t.id, t.depart_at,
             r.id AS route_id, r.origin, r.destination, r.origin_lat, r.origin_lng,
             r.dest_lat, r.dest_lng, r.distance_km, r.duration_min, r.base_fare,
             b.plate_no, b.last_inspection,
             m.name AS model_name, m.manufacturer, m.year, m.capacity, m.amenities, m.color,
             d.full_name, d.license_no, d.license_expiry, d.years_experience, d.rating,
             d.trips_completed, d.verified, d.background_check,
             (SELECT COUNT(*) FROM bookings k WHERE k.trip_id = t.id AND k.status <> 'cancelled') AS sold
        FROM trips t
        JOIN routes r     ON r.id = t.route_id
        JOIN buses b      ON b.id = t.bus_id
        JOIN bus_models m ON m.id = b.model_id
        JOIN drivers d    ON d.id = t.driver_id
       WHERE t.status = 'scheduled' AND b.status = 'active' AND t.depart_at > NOW()
             $extraWhere
       ORDER BY t.depart_at
       LIMIT " . (int) $limit;

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $fareTypes = all_fare_types();
    $out = [];

    foreach ($rows as $r) {
        $departDate  = substr((string) $r['depart_at'], 0, 10);
        $inspectFrom = date('Y-m-d', strtotime($departDate . ' -12 months'));
        $base        = (float) $r['base_fare'];
        $capacity    = (int) $r['capacity'];

        $fares = [];
        foreach ($fareTypes as $ft) {
            $fares[] = [
                'code'         => $ft['code'],
                'label'        => $ft['label'],
                'discount_pct' => $ft['discount_pct'],
                'note'         => $ft['note'],
                'price'        => fare_for($base, $ft['discount_pct']),
            ];
        }

        $out[] = [
            'id'         => (int) $r['id'],
            'depart_at'  => $r['depart_at'],
            'route'      => [
                'id'           => (int) $r['route_id'],
                'origin'       => $r['origin'],
                'destination'  => $r['destination'],
                'origin_lat'   => (float) $r['origin_lat'],
                'origin_lng'   => (float) $r['origin_lng'],
                'dest_lat'     => (float) $r['dest_lat'],
                'dest_lng'     => (float) $r['dest_lng'],
                'distance_km'  => (float) $r['distance_km'],
                'duration_min' => (int) $r['duration_min'],
                'base_fare'    => $base,
            ],
            'bus'        => [
                'plate_no'        => $r['plate_no'],
                'model_name'      => $r['model_name'],
                'manufacturer'    => $r['manufacturer'],
                'year'            => $r['year'] !== null ? (int) $r['year'] : null,
                'capacity'        => $capacity,
                'amenities'       => $r['amenities'],
                'color'           => $r['color'],
                'last_inspection' => $r['last_inspection'],
                'inspection_ok'   => $r['last_inspection'] !== null && $r['last_inspection'] >= $inspectFrom,
            ],
            'driver'     => [
                'name'             => $r['full_name'],
                'initials'         => initials((string) $r['full_name']),
                'license_masked'   => mask_license((string) $r['license_no']),
                'license_expiry'   => $r['license_expiry'],
                'license_valid'    => $r['license_expiry'] >= $departDate,
                'years_experience' => (int) $r['years_experience'],
                'rating'           => (float) $r['rating'],
                'trips_completed'  => (int) $r['trips_completed'],
                'verified'         => (bool) $r['verified'],
                'background_check' => (bool) $r['background_check'],
            ],
            'seats_total' => $capacity,
            'seats_left'  => max(0, $capacity - (int) $r['sold']),
            'fares'       => $fares,
        ];
    }
    return $out;
}
