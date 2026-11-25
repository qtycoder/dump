<?php
// What the admin panel can manage. Each entity lists its fields; the generic CRUD
// endpoint and the admin UI are both driven from this one file.
//
// field types: text, number (decimal => true for decimals), select, bool, date,
//              datetime, color, ref (foreign key to another entity here)
// flags:       ro (shown, never written), optional (empty allowed)
// {t} in SQL is replaced with the table alias.

return [

    'trips' => [
        'label' => 'Trips', 'table' => 'trips', 'pk' => 'id',
        'label_sql' => "CONCAT((SELECT CONCAT(r.origin, ' → ', r.destination) FROM routes r WHERE r.id = {t}.route_id), ' · ', DATE_FORMAT({t}.depart_at, '%b %e %H:%i'))",
        'order' => '{t}.depart_at DESC',
        'actions' => ['create' => true, 'update' => true, 'delete' => true],
        'fields' => [
            'route_id'  => ['type' => 'ref', 'ref' => 'routes',  'label' => 'Route'],
            'bus_id'    => ['type' => 'ref', 'ref' => 'buses',   'label' => 'Bus'],
            'driver_id' => ['type' => 'ref', 'ref' => 'drivers', 'label' => 'Driver'],
            'depart_at' => ['type' => 'datetime', 'label' => 'Departure'],
            'status'    => ['type' => 'select', 'label' => 'Status', 'options' => ['scheduled', 'cancelled', 'completed']],
        ],
        'extra' => [
            'sold' => ['label' => 'Seats sold', 'sql' => "(SELECT COUNT(*) FROM bookings k WHERE k.trip_id = {t}.id AND k.status <> 'cancelled')"],
        ],
        'list' => ['depart_at', 'route_id', 'bus_id', 'driver_id', 'sold', 'status'],
    ],

    'routes' => [
        'label' => 'Routes', 'table' => 'routes', 'pk' => 'id',
        'label_sql' => "CONCAT({t}.origin, ' → ', {t}.destination)",
        'order' => '{t}.origin, {t}.destination',
        'actions' => ['create' => true, 'update' => true, 'delete' => true],
        'fields' => [
            'origin'       => ['type' => 'text', 'label' => 'From', 'max' => 60],
            'destination'  => ['type' => 'text', 'label' => 'To', 'max' => 60],
            'origin_lat'   => ['type' => 'number', 'decimal' => true, 'label' => 'From latitude',  'min' => -90,  'max' => 90],
            'origin_lng'   => ['type' => 'number', 'decimal' => true, 'label' => 'From longitude', 'min' => -180, 'max' => 180],
            'dest_lat'     => ['type' => 'number', 'decimal' => true, 'label' => 'To latitude',    'min' => -90,  'max' => 90],
            'dest_lng'     => ['type' => 'number', 'decimal' => true, 'label' => 'To longitude',   'min' => -180, 'max' => 180],
            'distance_km'  => ['type' => 'number', 'decimal' => true, 'label' => 'Distance (km)', 'min' => 0, 'max' => 9999],
            'duration_min' => ['type' => 'number', 'label' => 'Duration (min)', 'min' => 0, 'max' => 5000],
            'base_fare'    => ['type' => 'number', 'decimal' => true, 'label' => 'Regular fare (₱)', 'min' => 0, 'max' => 99999],
        ],
        'list' => ['origin', 'destination', 'distance_km', 'duration_min', 'base_fare'],
    ],

    'buses' => [
        'label' => 'Buses', 'table' => 'buses', 'pk' => 'id',
        'label_sql' => '{t}.plate_no',
        'order' => '{t}.plate_no',
        'actions' => ['create' => true, 'update' => true, 'delete' => true],
        'fields' => [
            'plate_no'        => ['type' => 'text', 'label' => 'Plate no.', 'max' => 12],
            'model_id'        => ['type' => 'ref', 'ref' => 'bus_models', 'label' => 'Model'],
            'status'          => ['type' => 'select', 'label' => 'Status', 'options' => ['active', 'maintenance']],
            'last_inspection' => ['type' => 'date', 'label' => 'Last inspection', 'optional' => true],
        ],
        'list' => ['plate_no', 'model_id', 'status', 'last_inspection'],
    ],

    'bus_models' => [
        'label' => 'Bus models', 'table' => 'bus_models', 'pk' => 'id',
        'label_sql' => '{t}.name',
        'order' => '{t}.name',
        'actions' => ['create' => true, 'update' => true, 'delete' => true],
        'fields' => [
            'name'         => ['type' => 'text', 'label' => 'Model', 'max' => 80],
            'manufacturer' => ['type' => 'text', 'label' => 'Manufacturer', 'max' => 80],
            'year'         => ['type' => 'number', 'label' => 'Year', 'min' => 1980, 'max' => 2100, 'optional' => true],
            'capacity'     => ['type' => 'number', 'label' => 'Seats', 'min' => 8, 'max' => 90],
            'amenities'    => ['type' => 'text', 'label' => 'Amenities (comma separated)', 'max' => 255, 'optional' => true],
            'description'  => ['type' => 'text', 'label' => 'Description', 'max' => 255, 'optional' => true],
            'color'        => ['type' => 'color', 'label' => 'Card color'],
        ],
        'list' => ['name', 'manufacturer', 'year', 'capacity', 'color'],
    ],

    'drivers' => [
        'label' => 'Drivers', 'table' => 'drivers', 'pk' => 'id',
        'label_sql' => '{t}.full_name',
        'order' => '{t}.full_name',
        'actions' => ['create' => true, 'update' => true, 'delete' => true],
        'fields' => [
            'full_name'        => ['type' => 'text', 'label' => 'Full name', 'max' => 80],
            'license_no'       => ['type' => 'text', 'label' => "Driver's license no.", 'max' => 20],
            'license_expiry'   => ['type' => 'date', 'label' => 'License expiry'],
            'years_experience' => ['type' => 'number', 'label' => 'Years of experience', 'min' => 0, 'max' => 60],
            'rating'           => ['type' => 'number', 'decimal' => true, 'label' => 'Rating (0-5)', 'min' => 0, 'max' => 5],
            'trips_completed'  => ['type' => 'number', 'label' => 'Trips completed', 'min' => 0, 'max' => 10000000],
            'verified'         => ['type' => 'bool', 'label' => 'Identity verified'],
            'background_check' => ['type' => 'bool', 'label' => 'Background check cleared'],
        ],
        'list' => ['full_name', 'license_expiry', 'years_experience', 'rating', 'verified', 'background_check'],
    ],

    'fare_types' => [
        'label' => 'Fare types', 'table' => 'fare_types', 'pk' => 'id',
        'label_sql' => '{t}.label',
        'order' => '{t}.id',
        'actions' => ['create' => false, 'update' => true, 'delete' => false],
        'fields' => [
            'code'         => ['type' => 'text', 'label' => 'Code', 'ro' => true],
            'label'        => ['type' => 'text', 'label' => 'Label', 'max' => 40],
            'discount_pct' => ['type' => 'number', 'label' => 'Discount (%)', 'min' => 0, 'max' => 100],
            'note'         => ['type' => 'text', 'label' => 'Note shown to passengers', 'max' => 160, 'optional' => true],
        ],
        'list' => ['code', 'label', 'discount_pct', 'note'],
    ],

    'bookings' => [
        'label' => 'Bookings', 'table' => 'bookings', 'pk' => 'id',
        'label_sql' => '{t}.code',
        'order' => '{t}.id DESC',
        'actions' => ['create' => false, 'update' => true, 'delete' => false],
        'fields' => [
            'code'           => ['type' => 'text', 'label' => 'Code', 'ro' => true],
            'user_id'        => ['type' => 'ref', 'ref' => 'users', 'label' => 'Account', 'ro' => true],
            'trip_id'        => ['type' => 'ref', 'ref' => 'trips', 'label' => 'Trip', 'ro' => true],
            'seat_no'        => ['type' => 'number', 'label' => 'Seat', 'ro' => true],
            'contact_phone'  => ['type' => 'text', 'label' => 'Contact no.', 'ro' => true],
            'fare_type'      => ['type' => 'text', 'label' => 'Fare', 'ro' => true],
            'amount'         => ['type' => 'number', 'decimal' => true, 'label' => 'Amount (₱)', 'ro' => true],
            'payment_method' => ['type' => 'text', 'label' => 'Method', 'ro' => true],
            'payment_status' => ['type' => 'select', 'label' => 'Payment', 'options' => ['unpaid', 'paid', 'refunded']],
            'status'         => ['type' => 'select', 'label' => 'Status', 'options' => ['confirmed', 'cancelled']],
        ],
        'list' => ['code', 'user_id', 'trip_id', 'seat_no', 'contact_phone', 'fare_type', 'amount', 'payment_method', 'payment_status', 'status'],
    ],

    'users' => [
        'label' => 'Users', 'table' => 'users', 'pk' => 'id',
        'label_sql' => '{t}.name',
        'order' => '{t}.id DESC',
        'actions' => ['create' => true, 'update' => true, 'delete' => true],
        'fields' => [
            'name'       => ['type' => 'text', 'label' => 'Name', 'max' => 60],
            'email'      => ['type' => 'email', 'label' => 'Email', 'max' => 190, 'create_only' => true],
            'password'   => ['type' => 'password', 'label' => 'Password', 'column' => 'password_hash', 'virtual' => true],
            'role'       => ['type' => 'select', 'label' => 'Role', 'options' => ['user', 'admin']],
            'created_at' => ['type' => 'datetime', 'label' => 'Joined', 'ro' => true],
        ],
        'list' => ['name', 'email', 'role', 'created_at'],
    ],

];
