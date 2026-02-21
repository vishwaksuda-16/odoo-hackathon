/**
 * FleetFlow — Seed Script
 * Inserts demo users (one per role), vehicles, drivers, trips,
 * maintenance logs, fuel logs, and alerts for development/demo.
 *
 * Usage:  node seed.js
 */

import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST ?? 'localhost',
    database: process.env.DB_DATABASE ?? process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT ?? 5432),
});

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        /* ──────────────────────────────────────────────────────────────
           1. USERS  (one per role, password = "fleet123")
        ────────────────────────────────────────────────────────────── */
        const passwordHash = await bcrypt.hash('fleet123', 10);

        const users = [
            { username: 'admin_mgr', email: 'manager@fleetflow.io', role: 'manager' },
            { username: 'dispatch_ops', email: 'dispatcher@fleetflow.io', role: 'dispatcher' },
            { username: 'safety_lead', email: 'safety@fleetflow.io', role: 'safety_officer' },
            { username: 'data_analyst', email: 'analyst@fleetflow.io', role: 'analyst' },
        ];

        const userIds = {};
        for (const u of users) {
            const { rows } = await client.query(
                `INSERT INTO fleet_users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO UPDATE SET email = $2
         RETURNING id`,
                [u.username, u.email, passwordHash, u.role]
            );
            userIds[u.role] = rows[0].id;
        }
        console.log('✅ Users seeded:', userIds);

        /* ──────────────────────────────────────────────────────────────
           2. VEHICLES  (12 diverse vehicles)
        ────────────────────────────────────────────────────────────── */
        const vehicles = [
            { name: 'Tata Ace Gold', plate: 'KA-01-AB-1234', cls: 'van', region: 'Bangalore', load: 750, odo: 45200, due: 50000 },
            { name: 'Mahindra Bolero PU', plate: 'KA-02-CD-5678', cls: 'pickup', region: 'Mysore', load: 1250, odo: 78400, due: 80000 },
            { name: 'Ashok Leyland Dost', plate: 'KA-03-EF-9012', cls: 'van', region: 'Bangalore', load: 1500, odo: 32100, due: 40000 },
            { name: 'Eicher Pro 2049', plate: 'MH-04-GH-3456', cls: 'truck', region: 'Mumbai', load: 5000, odo: 125600, due: 130000 },
            { name: 'Tata 407 Gold', plate: 'MH-05-IJ-7890', cls: 'truck', region: 'Pune', load: 3500, odo: 91200, due: 100000 },
            { name: 'Maruti Suzuki Eeco', plate: 'DL-06-KL-2345', cls: 'van', region: 'Delhi', load: 600, odo: 18700, due: 20000 },
            { name: 'Force Traveller', plate: 'DL-07-MN-6789', cls: 'bus', region: 'Delhi', load: 2200, odo: 67800, due: 70000 },
            { name: 'BharatBenz 1217C', plate: 'TN-08-OP-0123', cls: 'truck', region: 'Chennai', load: 8000, odo: 154300, due: 160000 },
            { name: 'Isuzu D-Max V-Cross', plate: 'KA-09-QR-4567', cls: 'pickup', region: 'Hubli', load: 1000, odo: 52400, due: 55000 },
            { name: 'Tata Ultra T.7', plate: 'GJ-10-ST-8901', cls: 'truck', region: 'Ahmedabad', load: 4200, odo: 39800, due: 45000 },
            { name: 'Mahindra Supro VX', plate: 'RJ-11-UV-2345', cls: 'van', region: 'Jaipur', load: 900, odo: 27600, due: 30000 },
            { name: 'SML Isuzu Sartaj', plate: 'UP-12-WX-6789', cls: 'truck', region: 'Lucknow', load: 6500, odo: 112000, due: 115000 },
        ];

        const vehicleIds = [];
        for (const v of vehicles) {
            const { rows } = await client.query(
                `INSERT INTO vehicles (name_model, license_plate, vehicle_class, region, max_load_kg, odometer, service_due_km)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (license_plate) DO UPDATE SET name_model = $1, odometer = $6
         RETURNING id`,
                [v.name, v.plate, v.cls, v.region, v.load, v.odo, v.due]
            );
            vehicleIds.push(rows[0].id);
        }
        console.log('✅ Vehicles seeded:', vehicleIds.length);

        /* ──────────────────────────────────────────────────────────────
           3. DRIVERS  (10 drivers)
        ────────────────────────────────────────────────────────────── */
        const drivers = [
            { name: 'Ravi Kumar', expiry: '2027-08-15', cat: 'van', status: 'on_duty', score: 95 },
            { name: 'Suresh Patil', expiry: '2027-03-20', cat: 'truck', status: 'on_duty', score: 88 },
            { name: 'Anil Sharma', expiry: '2026-06-10', cat: 'van', status: 'on_duty', score: 72 },
            { name: 'Vijay Singh', expiry: '2027-11-30', cat: 'truck', status: 'on_duty', score: 91 },
            { name: 'Manoj Reddy', expiry: '2026-04-05', cat: 'pickup', status: 'on_duty', score: 64 },
            { name: 'Deepak Yadav', expiry: '2027-09-18', cat: 'bus', status: 'on_duty', score: 82 },
            { name: 'Prakash Joshi', expiry: '2026-02-01', cat: 'van', status: 'off_duty', score: 59 },  // expired license!
            { name: 'Amit Gupta', expiry: '2027-07-22', cat: 'truck', status: 'off_duty', score: 76 },
            { name: 'Rajesh Nair', expiry: '2027-12-14', cat: 'pickup', status: 'on_duty', score: 97 },
            { name: 'Kiran Deshmukh', expiry: '2028-01-05', cat: 'van', status: 'on_duty', score: 85 },
        ];

        const driverIds = [];
        for (const d of drivers) {
            const { rows } = await client.query(
                `INSERT INTO drivers (name, license_expiry, license_category, status, safety_score)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
                [d.name, d.expiry, d.cat, d.status, d.score]
            );
            driverIds.push(rows[0].id);
        }
        console.log('✅ Drivers seeded:', driverIds.length);

        /* ──────────────────────────────────────────────────────────────
           4. COMPLETED TRIPS  (20 trips across vehicles & drivers)
           We need to insert them as 'completed' directly since they're historical.
        ────────────────────────────────────────────────────────────── */
        const historicalTrips = [
            { vi: 0, di: 0, cargo: 500, startOdo: 43000, endOdo: 43850, date: '2026-01-05', liters: 45, fuelCost: 4500 },
            { vi: 1, di: 1, cargo: 1100, startOdo: 76000, endOdo: 77200, date: '2026-01-08', liters: 88, fuelCost: 8800 },
            { vi: 2, di: 2, cargo: 1200, startOdo: 30000, endOdo: 30800, date: '2026-01-10', liters: 42, fuelCost: 4200 },
            { vi: 3, di: 3, cargo: 4500, startOdo: 122000, endOdo: 123500, date: '2026-01-12', liters: 180, fuelCost: 18000 },
            { vi: 4, di: 1, cargo: 3000, startOdo: 88000, endOdo: 89500, date: '2026-01-15', liters: 130, fuelCost: 13000 },
            { vi: 0, di: 0, cargo: 600, startOdo: 43850, endOdo: 44300, date: '2026-01-18', liters: 24, fuelCost: 2400 },
            { vi: 5, di: 2, cargo: 400, startOdo: 17000, endOdo: 17650, date: '2026-01-20', liters: 35, fuelCost: 3500 },
            { vi: 7, di: 3, cargo: 7000, startOdo: 150000, endOdo: 152000, date: '2026-01-22', liters: 250, fuelCost: 25000 },
            { vi: 8, di: 4, cargo: 800, startOdo: 50000, endOdo: 51200, date: '2026-01-25', liters: 68, fuelCost: 6800 },
            { vi: 9, di: 3, cargo: 3800, startOdo: 37000, endOdo: 38200, date: '2026-01-28', liters: 95, fuelCost: 9500 },
            { vi: 10, di: 9, cargo: 700, startOdo: 25000, endOdo: 25900, date: '2026-02-01', liters: 48, fuelCost: 4800 },
            { vi: 11, di: 1, cargo: 5500, startOdo: 108000, endOdo: 110000, date: '2026-02-03', liters: 220, fuelCost: 22000 },
            { vi: 0, di: 0, cargo: 650, startOdo: 44300, endOdo: 44900, date: '2026-02-05', liters: 32, fuelCost: 3200 },
            { vi: 3, di: 3, cargo: 4800, startOdo: 123500, endOdo: 124800, date: '2026-02-07', liters: 155, fuelCost: 15500 },
            { vi: 1, di: 8, cargo: 950, startOdo: 77200, endOdo: 77900, date: '2026-02-10', liters: 52, fuelCost: 5200 },
            { vi: 6, di: 5, cargo: 1800, startOdo: 65000, endOdo: 66500, date: '2026-02-12', liters: 110, fuelCost: 11000 },
            { vi: 4, di: 3, cargo: 2800, startOdo: 89500, endOdo: 90500, date: '2026-02-14', liters: 85, fuelCost: 8500 },
            { vi: 2, di: 9, cargo: 1300, startOdo: 30800, endOdo: 31600, date: '2026-02-16', liters: 44, fuelCost: 4400 },
            { vi: 5, di: 2, cargo: 450, startOdo: 17650, endOdo: 18350, date: '2026-02-18', liters: 38, fuelCost: 3800 },
            { vi: 7, di: 3, cargo: 6500, startOdo: 152000, endOdo: 154000, date: '2026-02-20', liters: 240, fuelCost: 24000 },
        ];

        for (const t of historicalTrips) {
            const { rows: tripRows } = await client.query(
                `INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, end_odometer, dispatched_at, completed_at, created_by)
         VALUES ($1, $2, $3, 'completed', $4, $5, $6::TIMESTAMPTZ, ($6::TIMESTAMPTZ + INTERVAL '8 hours'), $7)
         RETURNING id`,
                [vehicleIds[t.vi], driverIds[t.di], t.cargo, t.startOdo, t.endOdo, `${t.date}T08:00:00+05:30`, userIds.manager]
            );
            // Fuel log
            await client.query(
                `INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost, log_date)
         VALUES ($1, $2, $3, $4, $5)`,
                [tripRows[0].id, vehicleIds[t.vi], t.liters, t.fuelCost, t.date]
            );
        }
        console.log('✅ Trips & fuel logs seeded:', historicalTrips.length);

        /* ──────────────────────────────────────────────────────────────
           5. MAINTENANCE LOGS  (8 service records)
        ────────────────────────────────────────────────────────────── */
        const maintLogs = [
            { vi: 0, cost: 3500, desc: 'Engine oil change + filter replacement', odoAt: 40000, date: '2025-11-10' },
            { vi: 1, cost: 8200, desc: 'Brake pad replacement + wheel alignment', odoAt: 72000, date: '2025-12-05' },
            { vi: 3, cost: 15000, desc: 'Major service — turbo inspection + coolant', odoAt: 118000, date: '2025-12-20' },
            { vi: 4, cost: 6800, desc: 'Clutch plate replacement', odoAt: 85000, date: '2026-01-02' },
            { vi: 7, cost: 22000, desc: 'Transmission overhaul + differential oil', odoAt: 145000, date: '2026-01-10' },
            { vi: 5, cost: 2200, desc: 'Tyre rotation + battery check', odoAt: 15000, date: '2026-01-15' },
            { vi: 10, cost: 4500, desc: 'Suspension bushings + oil change', odoAt: 22000, date: '2026-01-28' },
            { vi: 11, cost: 12000, desc: 'Injector cleaning + air filter + brake fluid', odoAt: 105000, date: '2026-02-05' },
        ];

        for (const m of maintLogs) {
            await client.query(
                `INSERT INTO maintenance_logs (vehicle_id, service_date, cost, description, odometer_at_service, performed_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [vehicleIds[m.vi], m.date, m.cost, m.desc, m.odoAt, userIds.manager]
            );
        }
        console.log('✅ Maintenance logs seeded:', maintLogs.length);

        /* ──────────────────────────────────────────────────────────────
           6. ALERTS  (sample alerts for UI)
        ────────────────────────────────────────────────────────────── */
        const alerts = [
            { vId: vehicleIds[7], dId: null, type: 'odometer_threshold', sev: 'critical', msg: 'BharatBenz 1217C (TN-08-OP-0123) has reached 154,300 km — service due at 160,000 km.' },
            { vId: vehicleIds[11], dId: null, type: 'odometer_threshold', sev: 'warning', msg: 'SML Isuzu Sartaj (UP-12-WX-6789) is 3,000 km from next service (due at 115,000 km).' },
            { vId: null, dId: driverIds[6], type: 'license_expiry_warning', sev: 'critical', msg: "Prakash Joshi's license expired on Feb 1, 2026. Renewal required immediately." },
            { vId: null, dId: driverIds[4], type: 'license_expiry_warning', sev: 'warning', msg: "Manoj Reddy's license expires in 43 days (Apr 5, 2026). Schedule renewal." },
            { vId: vehicleIds[3], dId: null, type: 'high_usage_rate', sev: 'warning', msg: 'Eicher Pro 2049 averaging 280 km/day over the last 30 days. Consider inspection.' },
        ];

        for (const a of alerts) {
            await client.query(
                `INSERT INTO maintenance_alerts (vehicle_id, driver_id, alert_type, severity, message)
         VALUES ($1, $2, $3, $4, $5)`,
                [a.vId, a.dId, a.type, a.sev, a.msg]
            );
        }
        console.log('✅ Alerts seeded:', alerts.length);

        await client.query('COMMIT');
        console.log('\n🎉 All seed data inserted successfully!\n');
        console.log('──────────────────────────────────────────');
        console.log('Demo Accounts (password: fleet123)');
        console.log('──────────────────────────────────────────');
        console.log('Manager:        admin_mgr / manager@fleetflow.io');
        console.log('Dispatcher:     dispatch_ops / dispatcher@fleetflow.io');
        console.log('Safety Officer: safety_lead / safety@fleetflow.io');
        console.log('Analyst:        data_analyst / analyst@fleetflow.io');
        console.log('──────────────────────────────────────────');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed error:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(() => process.exit(1));
