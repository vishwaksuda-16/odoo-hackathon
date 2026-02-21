import pool from '../config/db.js';
import { StateService } from '../services/stateService.js';

// ─────────────────────────────────────────────────────────────────
//  DISPATCH Trip
//  Full transactional dispatch with FOR UPDATE row locking.
//  After the previous session's stateService implementation,
//  all state mutations are centralized there.
// ─────────────────────────────────────────────────────────────────
export const createTrip = async (req, res) => {
    const { vehicle_id, driver_id, cargo_weight_kg } = req.body;
    const performedBy = req.user?.id ?? null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ── 1. Lock vehicle row FOR UPDATE ───────────────────────
        const vehicleRes = await client.query(
            `SELECT id, status, max_load_kg, odometer, vehicle_class
             FROM vehicles WHERE id = $1 FOR UPDATE`,
            [vehicle_id]
        );
        if (vehicleRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, code: 'DISPATCH_BLOCKED', reason: 'VEHICLE_NOT_FOUND' });
        }

        // ── 2. Lock driver row FOR UPDATE ────────────────────────
        const driverRes = await client.query(
            `SELECT id, status, license_expiry, license_category
             FROM drivers WHERE id = $1 FOR UPDATE`,
            [driver_id]
        );
        if (driverRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, code: 'DISPATCH_BLOCKED', reason: 'DRIVER_NOT_FOUND' });
        }

        const vehicle = vehicleRes.rows[0];
        const driver = driverRes.rows[0];

        // ── 3. Business rule validation (in-transaction) ─────────
        if (vehicle.status !== 'available') {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false, code: 'DISPATCH_BLOCKED', reason: 'VEHICLE_NOT_AVAILABLE',
                detail: `Vehicle is '${vehicle.status}'.`,
            });
        }
        if (driver.status === 'suspended') {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, code: 'DISPATCH_BLOCKED', reason: 'DRIVER_SUSPENDED' });
        }
        if (driver.status !== 'on_duty') {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false, code: 'DISPATCH_BLOCKED', reason: 'DRIVER_NOT_ON_DUTY',
                detail: `Driver is '${driver.status}'.`,
            });
        }
        if (new Date(driver.license_expiry) < new Date()) {
            await client.query('ROLLBACK');
            return res.status(422).json({
                success: false, code: 'DISPATCH_BLOCKED', reason: 'LICENSE_EXPIRED',
                detail: `License expired on ${driver.license_expiry}.`,
            });
        }
        if (driver.license_category && vehicle.vehicle_class &&
            driver.license_category !== vehicle.vehicle_class) {
            await client.query('ROLLBACK');
            return res.status(422).json({
                success: false, code: 'DISPATCH_BLOCKED', reason: 'LICENSE_CATEGORY_MISMATCH',
                detail: `Driver category '${driver.license_category}' ≠ vehicle class '${vehicle.vehicle_class}'.`,
            });
        }
        if (parseFloat(cargo_weight_kg) > parseFloat(vehicle.max_load_kg)) {
            await client.query('ROLLBACK');
            return res.status(422).json({
                success: false, code: 'DISPATCH_BLOCKED', reason: 'CARGO_EXCEEDS_CAPACITY',
                detail: `${cargo_weight_kg}kg > ${vehicle.max_load_kg}kg capacity.`,
            });
        }

        // ── 4. Insert trip (draft first, then dispatch atomically) ─
        const newTripRes = await client.query(
            `INSERT INTO trips
               (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, dispatched_at, created_by)
             VALUES ($1, $2, $3, 'draft', $4, NOW(), $5)
             RETURNING *`,
            [vehicle_id, driver_id, cargo_weight_kg, vehicle.odometer, performedBy]
        );
        const tripId = newTripRes.rows[0].id;

        // ── 5. Atomically transition all three states ─────────────
        await StateService.dispatchTrip(vehicle_id, driver_id, tripId, client, performedBy);

        // Audit trip creation
        await client.query(
            `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
             VALUES ('trip', $1, 'trip_created', $2, $3)`,
            [tripId, performedBy, JSON.stringify({ vehicle_id, driver_id, cargo_weight_kg })]
        );

        await client.query('COMMIT');

        // Check maintenance alert (non-blocking, outside transaction)
        StateService.checkMaintenanceAlert(vehicle_id).then(alert => {
            if (alert?.alert) console.warn(`[MAINTENANCE ALERT] Vehicle ${vehicle_id}: odometer ${alert.odometer} >= service_due ${alert.service_due_km}`);
        }).catch(() => { });

        return res.status(201).json({ success: true, trip: { ...newTripRes.rows[0], status: 'dispatched' } });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('[createTrip]', e.message);
        return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', reason: e.message });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────────
//  COMPLETE Trip
// ─────────────────────────────────────────────────────────────────
export const completeTrip = async (req, res) => {
    const { trip_id, final_odometer, liters, fuel_cost } = req.body;
    const performedBy = req.user?.id ?? null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lock trip + get vehicle/driver
        const tripRes = await client.query(
            `SELECT vehicle_id, driver_id, status, start_odometer
             FROM trips WHERE id = $1 FOR UPDATE`,
            [trip_id]
        );
        if (tripRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, code: 'NOT_FOUND', reason: 'TRIP_NOT_FOUND' });
        }

        const { vehicle_id, driver_id, status, start_odometer } = tripRes.rows[0];

        if (status !== 'dispatched') {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false, code: 'INVALID_STATE',
                reason: `Trip is '${status}', expected 'dispatched'.`,
            });
        }

        if (parseInt(final_odometer) <= parseInt(start_odometer ?? 0)) {
            await client.query('ROLLBACK');
            return res.status(422).json({
                success: false, code: 'INVALID_ODOMETER',
                reason: `final_odometer (${final_odometer}) must be > start_odometer (${start_odometer}).`,
            });
        }

        // Record fuel
        await client.query(
            `INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost) VALUES ($1, $2, $3, $4)`,
            [trip_id, vehicle_id, liters, fuel_cost]
        );

        // Set end_odometer on the trip
        await client.query(
            `UPDATE trips SET end_odometer = $1, completed_at = NOW() WHERE id = $2`,
            [final_odometer, trip_id]
        );

        // Atomically complete all states
        await StateService.completeTrip(vehicle_id, driver_id, trip_id, final_odometer, client, performedBy);

        await client.query('COMMIT');

        // Post-complete maintenance alert check
        StateService.checkMaintenanceAlert(vehicle_id).then(alert => {
            if (alert?.alert) console.warn(`[MAINTENANCE ALERT] Vehicle ${vehicle_id}: odometer ${alert.odometer} >= service_due ${alert.service_due_km}`);
        }).catch(() => { });

        return res.json({ success: true, message: 'Trip completed successfully.' });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('[completeTrip]', e.message);
        return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', reason: e.message });
    } finally {
        client.release();
    }
};

// ─────────────────────────────────────────────────────────────────
//  CANCEL Trip  (returns vehicle & driver to pre-trip state)
// ─────────────────────────────────────────────────────────────────
export const cancelTrip = async (req, res) => {
    const { trip_id } = req.body;
    const performedBy = req.user?.id ?? null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const tripRes = await client.query(
            `SELECT vehicle_id, driver_id, status FROM trips WHERE id = $1 FOR UPDATE`,
            [trip_id]
        );
        if (tripRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, code: 'NOT_FOUND', reason: 'TRIP_NOT_FOUND' });
        }

        const { vehicle_id, driver_id, status } = tripRes.rows[0];

        if (!['draft', 'dispatched'].includes(status)) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false, code: 'INVALID_STATE',
                reason: `Cannot cancel a trip with status '${status}'.`,
            });
        }

        await client.query(`UPDATE trips SET cancelled_at = NOW() WHERE id = $1`, [trip_id]);
        await StateService.cancelTrip(vehicle_id, driver_id, trip_id, client, performedBy);

        await client.query('COMMIT');
        return res.json({ success: true, message: 'Trip cancelled. Resources released.' });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('[cancelTrip]', e.message);
        return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', reason: e.message });
    } finally {
        client.release();
    }
};