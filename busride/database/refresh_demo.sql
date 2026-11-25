-- Busride: run this in phpMyAdmin (database "busride" -> SQL tab) whenever
--  * the same route shows up several times, or
--  * every trip says "no upcoming trips" because the sample dates have passed.
-- Safe to run again and again. Bookings are kept.

-- 1) Merge duplicate routes (keep the oldest one, move its trips over).
UPDATE trips t
JOIN routes r ON r.id = t.route_id
JOIN (SELECT origin, destination, MIN(id) AS keep_id FROM routes GROUP BY origin, destination) k
  ON k.origin = r.origin AND k.destination = r.destination
SET t.route_id = k.keep_id
WHERE t.route_id <> k.keep_id;

DELETE r FROM routes r
JOIN (SELECT origin, destination, MIN(id) AS keep_id FROM routes GROUP BY origin, destination) k
  ON k.origin = r.origin AND k.destination = r.destination
WHERE r.id <> k.keep_id;

-- 2) Give every route fresh departures (3 over the next ~2 days) when it has none coming up.
INSERT INTO trips (route_id, bus_id, driver_id, depart_at)
SELECT r.id,
       (SELECT b.id FROM buses b WHERE b.status = 'active' ORDER BY RAND() LIMIT 1),
       (SELECT d.id FROM drivers d ORDER BY RAND() LIMIT 1),
       NOW() + INTERVAL x.h HOUR
FROM routes r
JOIN (SELECT 8 AS h UNION ALL SELECT 30 UNION ALL SELECT 54) x
WHERE NOT EXISTS (SELECT 1 FROM trips t WHERE t.route_id = r.id AND t.status = 'scheduled' AND t.depart_at > NOW());
