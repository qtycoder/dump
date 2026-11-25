-- Busride schema + SAMPLE data.
-- Run:  mysql -u root -p < database/schema.sql
-- Needs MySQL 5.7+ or MariaDB 10.3+.
--
-- Already imported the older version of this file? Drop it first, then import again:
--   mysql -u root -p -e "DROP DATABASE busride"

CREATE DATABASE IF NOT EXISTS busride
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE busride;
SET time_zone = '+08:00';   -- sample trip times below are based on Philippine time

-- ---------------------------------------------------------------- users
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ----------------------------------------------------------- bus models
CREATE TABLE IF NOT EXISTS bus_models (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(80)  NOT NULL,
  manufacturer VARCHAR(80)  NOT NULL,
  year         SMALLINT UNSIGNED NULL,
  capacity     SMALLINT UNSIGNED NOT NULL,
  amenities    VARCHAR(255) NOT NULL DEFAULT '',
  description  VARCHAR(255) NOT NULL DEFAULT '',
  color        CHAR(7)      NOT NULL DEFAULT '#2fd6c8'
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- buses
CREATE TABLE IF NOT EXISTS buses (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  plate_no        VARCHAR(12)  NOT NULL,
  model_id        INT UNSIGNED NOT NULL,
  status          ENUM('active','maintenance') NOT NULL DEFAULT 'active',
  last_inspection DATE NULL,
  UNIQUE KEY uq_buses_plate (plate_no),
  CONSTRAINT fk_buses_model FOREIGN KEY (model_id) REFERENCES bus_models(id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------- drivers
CREATE TABLE IF NOT EXISTS drivers (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name        VARCHAR(80)  NOT NULL,
  license_no       VARCHAR(20)  NOT NULL,
  license_expiry   DATE NOT NULL,
  years_experience TINYINT UNSIGNED NOT NULL DEFAULT 0,
  rating           DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  trips_completed  INT UNSIGNED NOT NULL DEFAULT 0,
  verified         TINYINT(1) NOT NULL DEFAULT 0,
  background_check TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- --------------------------------------------------------------- routes
CREATE TABLE IF NOT EXISTS routes (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  origin       VARCHAR(60) NOT NULL,
  destination  VARCHAR(60) NOT NULL,
  origin_lat   DECIMAL(9,6) NOT NULL,
  origin_lng   DECIMAL(9,6) NOT NULL,
  dest_lat     DECIMAL(9,6) NOT NULL,
  dest_lng     DECIMAL(9,6) NOT NULL,
  distance_km  DECIMAL(6,1) NOT NULL DEFAULT 0,
  duration_min SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  base_fare    DECIMAL(8,2) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- trips
CREATE TABLE IF NOT EXISTS trips (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  route_id  INT UNSIGNED NOT NULL,
  bus_id    INT UNSIGNED NOT NULL,
  driver_id INT UNSIGNED NOT NULL,
  depart_at DATETIME NOT NULL,
  status    ENUM('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  KEY idx_trips_depart (depart_at),
  CONSTRAINT fk_trips_route  FOREIGN KEY (route_id)  REFERENCES routes(id),
  CONSTRAINT fk_trips_bus    FOREIGN KEY (bus_id)    REFERENCES buses(id),
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------- fare types
CREATE TABLE IF NOT EXISTS fare_types (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(12) NOT NULL,
  label        VARCHAR(40) NOT NULL,
  discount_pct TINYINT UNSIGNED NOT NULL DEFAULT 0,
  note         VARCHAR(160) NOT NULL DEFAULT '',
  UNIQUE KEY uq_fare_code (code)
) ENGINE=InnoDB;

-- ------------------------------------------------------------- bookings
CREATE TABLE IF NOT EXISTS bookings (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code           CHAR(10) NOT NULL,
  user_id        INT UNSIGNED NOT NULL,
  trip_id        INT UNSIGNED NOT NULL,
  seat_no        SMALLINT UNSIGNED NOT NULL,
  passenger_name VARCHAR(80) NOT NULL,
  contact_phone  VARCHAR(20) NOT NULL DEFAULT '',
  fare_type      VARCHAR(12) NOT NULL,
  amount         DECIMAL(8,2) NOT NULL,
  payment_method ENUM('cash','gcash','maya') NOT NULL,
  payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  reference_no   VARCHAR(20) NULL,
  status         ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- NULL once cancelled, so the seat can be booked again
  active_seat    SMALLINT UNSIGNED GENERATED ALWAYS AS (IF(status = 'cancelled', NULL, seat_no)) STORED,
  UNIQUE KEY uq_booking_code (code),
  UNIQUE KEY uq_active_seat (trip_id, active_seat),
  KEY idx_bookings_user (user_id),
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_bookings_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
) ENGINE=InnoDB;

-- Older databases: add the contact_phone column to bookings if it is missing.
SET @has_phone := (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'contact_phone');
SET @sql := IF(@has_phone = 0,
  'ALTER TABLE bookings ADD COLUMN contact_phone VARCHAR(20) NOT NULL DEFAULT '''' AFTER passenger_name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ======================================================== SAMPLE DATA ==
-- Everything below is made-up demo data. Edit or delete it from the admin panel.
-- Each sample block only runs when its table is empty, so importing this file again is safe.

INSERT INTO fare_types (code, label, discount_pct, note)
SELECT * FROM (
  SELECT 'regular' AS code, 'Regular' AS label, 0 AS discount_pct, 'Standard fare' AS note
  UNION ALL SELECT 'student', 'Student', 20, 'Valid student ID required when boarding'
  UNION ALL SELECT 'senior', 'Senior Citizen', 20, 'Valid senior citizen ID required when boarding'
  UNION ALL SELECT 'pwd', 'PWD', 20, 'Valid PWD ID required when boarding'
) x WHERE NOT EXISTS (SELECT 1 FROM fare_types);

INSERT INTO bus_models (name, manufacturer, year, capacity, amenities, description, color)
SELECT * FROM (
  SELECT 'Yutong ZK6122H9' AS name, 'Yutong' AS manufacturer, 2022 AS year, 45 AS capacity, 'Aircon, Reclining seats, USB charging, CCTV' AS amenities, 'Highway coach for longer trips.' AS description, '#2fd6c8' AS color
  UNION ALL SELECT 'Hyundai Universe', 'Hyundai', 2021, 45, 'Aircon, Reclining seats, CCTV', 'Comfortable and popular on provincial routes.', '#f58aa4'
  UNION ALL SELECT 'Hino RK1J', 'Hino', 2019, 49, 'Aircon, CCTV', 'Reliable city and near-province bus.', '#ffb347'
  UNION ALL SELECT 'King Long XMQ6127', 'King Long', 2023, 40, 'Aircon, Wi-Fi, USB charging, CCTV', 'Newer coach with extra legroom.', '#7aa7ff'
  UNION ALL SELECT 'Volvo B11R', 'Volvo', 2023, 36, 'Aircon, Fully reclining seats, Wi-Fi, USB charging, CCTV, Toilet', 'Premium deluxe coach.', '#b79cff'
) x WHERE NOT EXISTS (SELECT 1 FROM bus_models);

INSERT INTO buses (plate_no, model_id, status, last_inspection)
SELECT * FROM (
  SELECT 'DEM 1001' AS plate_no, 1 AS model_id, 'active' AS status, '2026-06-10' AS last_inspection
  UNION ALL SELECT 'DEM 1002', 2, 'active', '2026-07-22'
  UNION ALL SELECT 'DEM 1003', 3, 'active', '2026-05-03'
  UNION ALL SELECT 'DEM 1004', 4, 'active', '2026-08-15'
  UNION ALL SELECT 'DEM 1005', 5, 'active', '2026-09-01'
  UNION ALL SELECT 'DEM 1006', 3, 'active', '2026-04-18'
) x WHERE NOT EXISTS (SELECT 1 FROM buses);

INSERT INTO drivers (full_name, license_no, license_expiry, years_experience, rating, trips_completed, verified, background_check)
SELECT * FROM (
  SELECT 'Ramon D. Villanueva' AS full_name, 'N02-18-004211' AS license_no, '2028-04-12' AS license_expiry, 14 AS years_experience, 4.9 AS rating, 3120 AS trips_completed, 1 AS verified, 1 AS background_check
  UNION ALL SELECT 'Jose M. Santiago', 'N03-20-118842', '2027-09-30', 9, 4.8, 2210, 1, 1
  UNION ALL SELECT 'Eduardo P. Bautista', 'N02-15-076519', '2027-01-18', 18, 4.7, 4875, 1, 1
  UNION ALL SELECT 'Arnel C. Dela Cruz', 'N04-21-203377', '2029-02-05', 6, 4.6, 1320, 1, 1
  UNION ALL SELECT 'Marlon S. Aquino', 'N01-17-059964', '2027-11-21', 11, 4.8, 2760, 1, 1
  UNION ALL SELECT 'Benjie T. Ramos', 'N02-22-310045', '2028-08-09', 4, 4.5, 640, 1, 0
) x WHERE NOT EXISTS (SELECT 1 FROM drivers);

INSERT INTO routes (origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, distance_km, duration_min, base_fare)
SELECT * FROM (
  SELECT 'Cavite City' AS origin, 'Manila (Lawton)' AS destination, 14.479100 AS origin_lat, 120.897000 AS origin_lng, 14.593400 AS dest_lat, 120.981400 AS dest_lng, 36.0 AS distance_km, 95 AS duration_min, 85.00 AS base_fare
  UNION ALL SELECT 'Cavite City', 'Pasay (Taft)', 14.479100, 120.897000, 14.537800, 121.001400, 29.0, 80, 70.00
  UNION ALL SELECT 'Imus', 'Makati (Ayala)', 14.429700, 120.936700, 14.554700, 121.024400, 27.5, 75, 80.00
  UNION ALL SELECT 'Dasmariñas', 'Cubao', 14.329400, 120.936700, 14.618900, 121.052500, 48.0, 120, 120.00
  UNION ALL SELECT 'Manila (Lawton)', 'Baguio', 14.593400, 120.981400, 16.402300, 120.596000, 250.0, 330, 550.00
  UNION ALL SELECT 'Manila (Lawton)', 'Batangas City', 14.593400, 120.981400, 13.756500, 121.058300, 115.0, 170, 220.00
  UNION ALL SELECT 'Tagaytay', 'Manila (Lawton)', 14.115300, 120.962100, 14.593400, 120.981400, 62.0, 130, 150.00
) x WHERE NOT EXISTS (SELECT 1 FROM routes);

-- Departures are relative to the moment you import this file.
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT * FROM (
  SELECT 1 AS route_id, 1 AS bus_id, 1 AS driver_id, NOW() + INTERVAL 3 HOUR AS depart_at
  UNION ALL SELECT 1, 2, 2, NOW() + INTERVAL 6 HOUR
  UNION ALL SELECT 1, 4, 4, NOW() + INTERVAL 27 HOUR
  UNION ALL SELECT 2, 3, 3, NOW() + INTERVAL 4 HOUR
  UNION ALL SELECT 2, 5, 5, NOW() + INTERVAL 28 HOUR
  UNION ALL SELECT 3, 2, 2, NOW() + INTERVAL 5 HOUR
  UNION ALL SELECT 3, 6, 6, NOW() + INTERVAL 30 HOUR
  UNION ALL SELECT 4, 4, 4, NOW() + INTERVAL 8 HOUR
  UNION ALL SELECT 4, 1, 1, NOW() + INTERVAL 32 HOUR
  UNION ALL SELECT 5, 5, 5, NOW() + INTERVAL 12 HOUR
  UNION ALL SELECT 5, 3, 3, NOW() + INTERVAL 36 HOUR
  UNION ALL SELECT 6, 6, 6, NOW() + INTERVAL 10 HOUR
  UNION ALL SELECT 7, 2, 2, NOW() + INTERVAL 14 HOUR
) x WHERE NOT EXISTS (SELECT 1 FROM trips);

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

-- Make your admin account: open http://localhost/busride/setup.html (works once, from this computer),
-- or run:  php database/create_admin.php "Your Name" you@example.com
