-- Upgrade for databases imported from the older schema.sql.
-- Run ONCE on the existing `busride` database (phpMyAdmin: select busride > Import).
USE busride;
SET time_zone = '+08:00';

SET @has_phone := (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'contact_phone');
SET @sql := IF(@has_phone = 0,
  'ALTER TABLE bookings ADD COLUMN contact_phone VARCHAR(20) NOT NULL DEFAULT '''' AFTER passenger_name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ---- More destinations (safe to run more than once) ----
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Cubao)', 'Vigan', 14.6189, 121.0525, 17.5747, 120.3869, 408, 510, 800 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Cubao)' AND destination = 'Vigan');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Cubao)', 'Laoag', 14.6189, 121.0525, 18.1978, 120.5936, 480, 600, 950 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Cubao)' AND destination = 'Laoag');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Cubao)', 'Tuguegarao', 14.6189, 121.0525, 17.6132, 121.727, 480, 600, 900 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Cubao)' AND destination = 'Tuguegarao');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Cubao)', 'Baler', 14.6189, 121.0525, 15.7586, 121.5624, 230, 330, 480 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Cubao)' AND destination = 'Baler');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Cubao)', 'Legazpi', 14.6189, 121.0525, 13.1391, 123.7438, 520, 600, 1050 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Cubao)' AND destination = 'Legazpi');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Cubao)', 'Naga', 14.6189, 121.0525, 13.6218, 123.1948, 430, 540, 900 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Cubao)' AND destination = 'Naga');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Pasay)', 'Lucena', 14.5378, 121.0014, 13.9373, 121.6171, 135, 210, 260 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Pasay)' AND destination = 'Lucena');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Lawton)', 'Olongapo', 14.5934, 120.9814, 14.8292, 120.2828, 130, 180, 250 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Lawton)' AND destination = 'Olongapo');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Cubao)', 'Angeles (Clark)', 14.6189, 121.0525, 15.145, 120.5887, 85, 120, 180 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Cubao)' AND destination = 'Angeles (Clark)');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Cubao)', 'San Fernando (La Union)', 14.6189, 121.0525, 16.6159, 120.3209, 270, 330, 560 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Cubao)' AND destination = 'San Fernando (La Union)');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Manila (Pasay)', 'Nasugbu', 14.5378, 121.0014, 14.0719, 120.6325, 100, 180, 200 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Manila (Pasay)' AND destination = 'Nasugbu');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Baguio', 'Manila (Cubao)', 16.4023, 120.596, 14.6189, 121.0525, 250, 330, 550 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Baguio' AND destination = 'Manila (Cubao)');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Batangas City', 'Manila (Pasay)', 13.7565, 121.0583, 14.5378, 121.0014, 115, 170, 220 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Batangas City' AND destination = 'Manila (Pasay)');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Cavite City', 'Tagaytay', 14.4791, 120.897, 14.1153, 120.9621, 50, 100, 120 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Cavite City' AND destination = 'Tagaytay');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Laoag', 'Manila (Cubao)', 18.1978, 120.5936, 14.6189, 121.0525, 480, 600, 950 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Laoag' AND destination = 'Manila (Cubao)');
INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT 'Vigan', 'Manila (Cubao)', 17.5747, 120.3869, 14.6189, 121.0525, 408, 510, 800 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM routes WHERE origin = 'Vigan' AND destination = 'Manila (Cubao)');

-- Sample departures for the new routes (only for routes that have no trips yet).
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 5 AS bus, 1 AS drv, 16 AS h UNION ALL SELECT 1 AS bus, 3 AS drv, 40 AS h) x
WHERE r.origin = 'Manila (Cubao)' AND r.destination = 'Vigan'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 5 AS bus, 5 AS drv, 20 AS h UNION ALL SELECT 4 AS bus, 2 AS drv, 44 AS h) x
WHERE r.origin = 'Manila (Cubao)' AND r.destination = 'Laoag'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 1 AS bus, 3 AS drv, 18 AS h UNION ALL SELECT 4 AS bus, 4 AS drv, 42 AS h) x
WHERE r.origin = 'Manila (Cubao)' AND r.destination = 'Tuguegarao'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 4 AS bus, 4 AS drv, 9 AS h UNION ALL SELECT 2 AS bus, 2 AS drv, 33 AS h) x
WHERE r.origin = 'Manila (Cubao)' AND r.destination = 'Baler'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 5 AS bus, 1 AS drv, 22 AS h UNION ALL SELECT 1 AS bus, 5 AS drv, 46 AS h) x
WHERE r.origin = 'Manila (Cubao)' AND r.destination = 'Legazpi'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 4 AS bus, 5 AS drv, 21 AS h UNION ALL SELECT 2 AS bus, 3 AS drv, 45 AS h) x
WHERE r.origin = 'Manila (Cubao)' AND r.destination = 'Naga'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 2 AS bus, 2 AS drv, 7 AS h UNION ALL SELECT 3 AS bus, 6 AS drv, 31 AS h) x
WHERE r.origin = 'Manila (Pasay)' AND r.destination = 'Lucena'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 3 AS bus, 3 AS drv, 11 AS h UNION ALL SELECT 6 AS bus, 6 AS drv, 35 AS h) x
WHERE r.origin = 'Manila (Lawton)' AND r.destination = 'Olongapo'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 2 AS bus, 2 AS drv, 5 AS h UNION ALL SELECT 4 AS bus, 4 AS drv, 29 AS h) x
WHERE r.origin = 'Manila (Cubao)' AND r.destination = 'Angeles (Clark)'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 1 AS bus, 1 AS drv, 13 AS h UNION ALL SELECT 5 AS bus, 5 AS drv, 37 AS h) x
WHERE r.origin = 'Manila (Cubao)' AND r.destination = 'San Fernando (La Union)'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 3 AS bus, 3 AS drv, 8 AS h UNION ALL SELECT 6 AS bus, 6 AS drv, 32 AS h) x
WHERE r.origin = 'Manila (Pasay)' AND r.destination = 'Nasugbu'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 5 AS bus, 1 AS drv, 15 AS h UNION ALL SELECT 1 AS bus, 3 AS drv, 39 AS h) x
WHERE r.origin = 'Baguio' AND r.destination = 'Manila (Cubao)'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 6 AS bus, 6 AS drv, 10 AS h UNION ALL SELECT 3 AS bus, 3 AS drv, 34 AS h) x
WHERE r.origin = 'Batangas City' AND r.destination = 'Manila (Pasay)'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 2 AS bus, 2 AS drv, 6 AS h UNION ALL SELECT 3 AS bus, 3 AS drv, 30 AS h) x
WHERE r.origin = 'Cavite City' AND r.destination = 'Tagaytay'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 5 AS bus, 5 AS drv, 19 AS h UNION ALL SELECT 1 AS bus, 1 AS drv, 43 AS h) x
WHERE r.origin = 'Laoag' AND r.destination = 'Manila (Cubao)'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id, x.bus, x.drv, NOW() + INTERVAL x.h HOUR FROM routes r JOIN (SELECT 4 AS bus, 4 AS drv, 17 AS h UNION ALL SELECT 5 AS bus, 1 AS drv, 41 AS h) x
WHERE r.origin = 'Vigan' AND r.destination = 'Manila (Cubao)'
AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id);
