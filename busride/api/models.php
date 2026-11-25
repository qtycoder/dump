<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/db.php';

require_method('GET');

$rows = db()->query("
  SELECT m.id, m.name, m.manufacturer, m.year, m.capacity, m.amenities, m.description, m.color,
         (SELECT COUNT(*) FROM buses b WHERE b.model_id = m.id AND b.status = 'active') AS buses_in_service
    FROM bus_models m
   ORDER BY m.name
")->fetchAll();

$models = [];
foreach ($rows as $r) {
    $models[] = [
        'id'              => (int) $r['id'],
        'name'            => $r['name'],
        'manufacturer'    => $r['manufacturer'],
        'year'            => $r['year'] !== null ? (int) $r['year'] : null,
        'capacity'        => (int) $r['capacity'],
        'amenities'       => array_values(array_filter(array_map('trim', explode(',', (string) $r['amenities'])))),
        'description'     => $r['description'],
        'color'           => $r['color'],
        'buses_in_service'=> (int) $r['buses_in_service'],
    ];
}

json_out(['models' => $models]);
