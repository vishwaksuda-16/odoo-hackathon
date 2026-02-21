-- ================================================================
--  FleetFlow — SQL Seed for Docker Postgres
--  Password for all demo accounts: fleet123
--  Hash: $2b$10$bwvji.kFLJ8oCKI6YioD2.5j1XvwfMeczbxqoBf2S/iYaYSVysuyS
-- ================================================================

-- Clean slate
TRUNCATE fleet_users, vehicles, drivers, maintenance_logs, maintenance_alerts
  RESTART IDENTITY CASCADE;

-- ── 1. USERS ────────────────────────────────────────────────────
INSERT INTO fleet_users (username, email, password_hash, role) VALUES
  ('admin_mgr',    'manager@fleetflow.io',    '$2b$10$bwvji.kFLJ8oCKI6YioD2.5j1XvwfMeczbxqoBf2S/iYaYSVysuyS', 'manager'),
  ('dispatch_ops', 'dispatcher@fleetflow.io', '$2b$10$bwvji.kFLJ8oCKI6YioD2.5j1XvwfMeczbxqoBf2S/iYaYSVysuyS', 'dispatcher'),
  ('safety_lead',  'safety@fleetflow.io',     '$2b$10$bwvji.kFLJ8oCKI6YioD2.5j1XvwfMeczbxqoBf2S/iYaYSVysuyS', 'safety_officer'),
  ('data_analyst', 'analyst@fleetflow.io',    '$2b$10$bwvji.kFLJ8oCKI6YioD2.5j1XvwfMeczbxqoBf2S/iYaYSVysuyS', 'analyst');

-- ── 2. VEHICLES ──────────────────────────────────────────────────
INSERT INTO vehicles (name_model, license_plate, vehicle_class, region, max_load_kg, odometer, service_due_km) VALUES
  ('Tata Ace Gold',        'KA-01-AB-1234', 'van',    'Bangalore',  750,   45200,  50000),
  ('Mahindra Bolero PU',   'KA-02-CD-5678', 'pickup', 'Mysore',     1250,  78400,  80000),
  ('Ashok Leyland Dost',   'KA-03-EF-9012', 'van',    'Bangalore',  1500,  32100,  40000),
  ('Eicher Pro 2049',      'MH-04-GH-3456', 'truck',  'Mumbai',     5000,  125600, 130000),
  ('Tata 407 Gold',        'MH-05-IJ-7890', 'truck',  'Pune',       3500,  91200,  100000),
  ('Maruti Suzuki Eeco',   'DL-06-KL-2345', 'van',    'Delhi',      600,   18700,  20000),
  ('Force Traveller',      'DL-07-MN-6789', 'bus',    'Delhi',      2200,  67800,  70000),
  ('BharatBenz 1217C',     'TN-08-OP-0123', 'truck',  'Chennai',    8000,  154300, 160000),
  ('Isuzu D-Max V-Cross',  'KA-09-QR-4567', 'pickup', 'Hubli',      1000,  52400,  55000),
  ('Tata Ultra T.7',       'GJ-10-ST-8901', 'truck',  'Ahmedabad',  4200,  39800,  45000),
  ('Mahindra Supro VX',    'RJ-11-UV-2345', 'van',    'Jaipur',     900,   27600,  30000),
  ('SML Isuzu Sartaj',     'UP-12-WX-6789', 'truck',  'Lucknow',    6500,  112000, 115000);

-- ── 3. DRIVERS ───────────────────────────────────────────────────
INSERT INTO drivers (name, license_expiry, license_category, status, safety_score) VALUES
  ('Ravi Kumar',     '2027-08-15', 'van',    'on_duty',  95),
  ('Suresh Patil',   '2027-03-20', 'truck',  'on_duty',  88),
  ('Anil Sharma',    '2026-06-10', 'van',    'on_duty',  72),
  ('Vijay Singh',    '2027-11-30', 'truck',  'on_duty',  91),
  ('Manoj Reddy',    '2026-04-05', 'pickup', 'on_duty',  64),
  ('Deepak Yadav',   '2027-09-18', 'bus',    'on_duty',  82),
  ('Prakash Joshi',  '2026-02-01', 'van',    'off_duty', 59),
  ('Amit Gupta',     '2027-07-22', 'truck',  'off_duty', 76),
  ('Rajesh Nair',    '2027-12-14', 'pickup', 'on_duty',  97),
  ('Kiran Deshmukh', '2028-01-05', 'van',    'on_duty',  85);

-- ── 4. COMPLETED TRIPS + FUEL LOGS ──────────────────────────────
DO $$
DECLARE
  v_ids INT[];
  d_ids INT[];
  t_id  INT;
BEGIN
  SELECT ARRAY_AGG(id ORDER BY id) INTO v_ids FROM vehicles;
  SELECT ARRAY_AGG(id ORDER BY id) INTO d_ids FROM drivers;

  -- Trip 1
  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[1], d_ids[1], 500,  'completed', 43000,  43850,  '2026-01-05 08:00:00+05:30', '2026-01-05 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[1], 45,  4500,  '2026-01-05');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[2], d_ids[2], 1100, 'completed', 76000,  77200,  '2026-01-08 08:00:00+05:30', '2026-01-08 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[2], 88,  8800,  '2026-01-08');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[3], d_ids[3], 1200, 'completed', 30000,  30800,  '2026-01-10 08:00:00+05:30', '2026-01-10 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[3], 42,  4200,  '2026-01-10');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[4], d_ids[4], 4500, 'completed', 122000, 123500, '2026-01-12 08:00:00+05:30', '2026-01-12 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[4], 180, 18000, '2026-01-12');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[5], d_ids[2], 3000, 'completed', 88000,  89500,  '2026-01-15 08:00:00+05:30', '2026-01-15 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[5], 130, 13000, '2026-01-15');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[1], d_ids[1], 600,  'completed', 43850,  44300,  '2026-01-18 08:00:00+05:30', '2026-01-18 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[1], 24,  2400,  '2026-01-18');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[6], d_ids[3], 400,  'completed', 17000,  17650,  '2026-01-20 08:00:00+05:30', '2026-01-20 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[6], 35,  3500,  '2026-01-20');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[8], d_ids[4], 7000, 'completed', 150000, 152000, '2026-01-22 08:00:00+05:30', '2026-01-22 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[8], 250, 25000, '2026-01-22');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[9], d_ids[5], 800,  'completed', 50000,  51200,  '2026-01-25 08:00:00+05:30', '2026-01-25 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[9], 68,  6800,  '2026-01-25');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[10], d_ids[4], 3800, 'completed', 37000,  38200,  '2026-01-28 08:00:00+05:30', '2026-01-28 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[10], 95,  9500,  '2026-01-28');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[11], d_ids[10], 700, 'completed', 25000,  25900,  '2026-02-01 08:00:00+05:30', '2026-02-01 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[11], 48,  4800,  '2026-02-01');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[12], d_ids[2], 5500, 'completed', 108000, 110000, '2026-02-03 08:00:00+05:30', '2026-02-03 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[12], 220, 22000, '2026-02-03');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[1], d_ids[1], 650,  'completed', 44300,  44900,  '2026-02-05 08:00:00+05:30', '2026-02-05 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[1], 32,  3200,  '2026-02-05');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[4], d_ids[4], 4800, 'completed', 123500, 124800, '2026-02-07 08:00:00+05:30', '2026-02-07 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[4], 155, 15500, '2026-02-07');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[2], d_ids[9], 950,  'completed', 77200,  77900,  '2026-02-10 08:00:00+05:30', '2026-02-10 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[2], 52,  5200,  '2026-02-10');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[7], d_ids[6], 1800, 'completed', 65000,  66500,  '2026-02-12 08:00:00+05:30', '2026-02-12 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[7], 110, 11000, '2026-02-12');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[5], d_ids[4], 2800, 'completed', 89500,  90500,  '2026-02-14 08:00:00+05:30', '2026-02-14 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[5], 85,  8500,  '2026-02-14');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[3], d_ids[10], 1300, 'completed', 30800, 31600,  '2026-02-16 08:00:00+05:30', '2026-02-16 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[3], 44,  4400,  '2026-02-16');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[6], d_ids[3], 450,  'completed', 17650,  18350,  '2026-02-18 08:00:00+05:30', '2026-02-18 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[6], 38,  3800,  '2026-02-18');

  INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
    VALUES (v_ids[8], d_ids[4], 6500, 'completed', 152000, 154000, '2026-02-20 08:00:00+05:30', '2026-02-20 16:00:00+05:30', 1) RETURNING id INTO t_id;
  INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date) VALUES (t_id, v_ids[8], 240, 24000, '2026-02-20');
END $$;

-- ── 5. MAINTENANCE LOGS ──────────────────────────────────────────
INSERT INTO maintenance_logs (vehicle_id, service_date, cost, description, odometer_at_service, performed_by)
SELECT v.id, m.sdate::date, m.cost::numeric, m.descr, m.odo::int, 1
FROM (VALUES
  ('KA-01-AB-1234', '2025-11-10', 3500,  'Engine oil change + filter replacement',             40000),
  ('KA-02-CD-5678', '2025-12-05', 8200,  'Brake pad replacement + wheel alignment',            72000),
  ('MH-04-GH-3456', '2025-12-20', 15000, 'Major service — turbo inspection + coolant flush', 118000),
  ('MH-05-IJ-7890', '2026-01-02', 6800,  'Clutch plate replacement',                           85000),
  ('TN-08-OP-0123', '2026-01-10', 22000, 'Transmission overhaul + differential oil change',  145000),
  ('DL-06-KL-2345', '2026-01-15', 2200,  'Tyre rotation + battery check',                     15000),
  ('RJ-11-UV-2345', '2026-01-28', 4500,  'Suspension bushings + oil change',                  22000),
  ('UP-12-WX-6789', '2026-02-05', 12000, 'Injector cleaning + air filter + brake fluid',    105000)
) AS m(plate, sdate, cost, descr, odo)
JOIN vehicles v ON v.license_plate = m.plate;

-- ── 6. ALERTS ────────────────────────────────────────────────────
INSERT INTO maintenance_alerts (vehicle_id, driver_id, alert_type, severity, message)
SELECT v.id, NULL, 'odometer_threshold', 'critical',
  'BharatBenz 1217C (TN-08-OP-0123) has reached 154,300 km — service due at 160,000 km.'
FROM vehicles v WHERE v.license_plate = 'TN-08-OP-0123';

INSERT INTO maintenance_alerts (vehicle_id, driver_id, alert_type, severity, message)
SELECT v.id, NULL, 'odometer_threshold', 'warning',
  'SML Isuzu Sartaj (UP-12-WX-6789) is 3,000 km from its next service (due at 115,000 km).'
FROM vehicles v WHERE v.license_plate = 'UP-12-WX-6789';

INSERT INTO maintenance_alerts (vehicle_id, driver_id, alert_type, severity, message)
SELECT NULL, d.id, 'license_expiry_warning', 'critical',
  'Prakash Joshi''s license expired on Feb 1, 2026. Renewal required immediately.'
FROM drivers d WHERE d.name = 'Prakash Joshi';

INSERT INTO maintenance_alerts (vehicle_id, driver_id, alert_type, severity, message)
SELECT NULL, d.id, 'license_expiry_warning', 'warning',
  'Manoj Reddy''s license expires Apr 5, 2026 (43 days). Schedule renewal soon.'
FROM drivers d WHERE d.name = 'Manoj Reddy';

INSERT INTO maintenance_alerts (vehicle_id, driver_id, alert_type, severity, message)
SELECT v.id, NULL, 'high_usage_rate', 'warning',
  'Eicher Pro 2049 averaging 280 km/day over the last 30 days. Consider early inspection.'
FROM vehicles v WHERE v.license_plate = 'MH-04-GH-3456';

-- Verify
SELECT 'fleet_users' AS tbl, COUNT(*) FROM fleet_users
UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'drivers',  COUNT(*) FROM drivers
UNION ALL SELECT 'trips',    COUNT(*) FROM trips
UNION ALL SELECT 'fuel_logs',COUNT(*) FROM fuel_logs
UNION ALL SELECT 'maint_logs',COUNT(*) FROM maintenance_logs
UNION ALL SELECT 'alerts',   COUNT(*) FROM maintenance_alerts;
