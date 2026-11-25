<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/trips.php';

require_method('GET');

$rows = db()->query("
  SELECT r.id, r.origin, r.destination, r.distance_km, r.duration_min, r.base_fare,
         (SELECT COUNT(*) FROM trips t
           WHERE t.route_id = r.id AND t.status = 'scheduled' AND t.depart_at > NOW()) AS upcoming
    FROM routes r
   ORDER BY r.origin, r.destination
")->fetchAll();

$fareTypes   = all_fare_types();
$maxDiscount = $fareTypes ? max(array_column($fareTypes, 'discount_pct')) : 0;

$routes = [];
foreach ($rows as $r) {
    $base = (float) $r['base_fare'];
    $routes[] = [
        'id'           => (int) $r['id'],
        'origin'       => $r['origin'],
        'destination'  => $r['destination'],
        'distance_km'  => (float) $r['distance_km'],
        'duration_min' => (int) $r['duration_min'],
        'base_fare'    => $base,
        'from_price'   => fare_for($base, (int) $maxDiscount),
        'upcoming'     => (int) $r['upcoming'],
    ];
}

json_out(['routes' => $routes, 'fare_types' => $fareTypes]);
