import pool, { withTransaction } from '../config/db.js';
import { StateService } from '../services/stateService.js';

// ─────────────────────────────────────────────────────────────────
//  DISPATCH Trip
//
//  Locking order is always: vehicle → driver → trip (alphabetical by
//  table name) to prevent deadlocks across concurrent transactions.
//
//  Double-dispatch is prevented at three layers:
//    1. Partial unique index on trips(vehicle_id) WHERE active
//    2. FOR UPDATE NOWAIT row lock (fails instantly if locked)
//    3. SERIALIZABLE isolation in dispatchTripInTx (via stateService)
// ─────────────────────────────────────────────────────────────────
export const createTrip = async (req, res) => {
    const { vehicle_id, driver_id, cargo_weight_kg } = req.body;
    const performedBy = req.user?.id ?? null;

    try {
        const trip = await withTransaction(async (client) => {

            // ── 1. Lock & validate vehicle (FOR UPDATE NOWAIT) ────
            const vehicleRes = await client.query(
                `SELECT id, status, max_load_kg, odometer, vehicle_class
                 FROM vehicles WHERE id = $1 FOR UPDATE NOWAIT`,
                [vehicle_id]
            );
            if (vehicleRes.rowCount === 0) throw Object.assign(
                new Error('VEHICLE_NOT_FOUND'), { httpStatus: 404 }
            );

            // ── 2. Lock & validate driver ─────────────────────────
            const driverRes = await client.query(
                `SELECT id, status, license_expiry, license_category
                 FROM drivers WHERE id = $1 FOR UPDATE NOWAIT`,
                [driver_id]
            );
            if (driverRes.rowCount === 0) throw Object.assign(
                new Error('DRIVER_NOT_FOUND'), { httpStatus: 404 }
            );

            const vehicle = vehicleRes.rows[0];
            const driver = driverRes.rows[0];

            // ── 3. Business rule validation (inside transaction) ──
            if (vehicle.status !== 'available') throw Object.assign(
                new Error('VEHICLE_NOT_AVAILABLE'), {
                    httpStatus: 409,
                detail: `Vehicle is '${vehicle.status}'.`
            }
            );
            if (driver.status === 'suspended') throw Object.assign(
                new Error('DRIVER_SUSPENDED'), { httpStatus: 409 }
            );
            if (driver.status !== 'on_duty') throw Object.assign(
                new Error('DRIVER_NOT_ON_DUTY'), {
                    httpStatus: 409,
                detail: `Driver is '${driver.status}'.`
            }
            );
            if (new Date(driver.license_expiry) < new Date()) throw Object.assign(
                new Error('LICENSE_EXPIRED'), {
                    httpStatus: 422,
                detail: `Expired on ${driver.license_expiry}.`
            }
            );
            if (driver.license_category && vehicle.vehicle_class &&
                driver.license_category !== vehicle.vehicle_class) throw Object.assign(
                    new Error('LICENSE_CATEGORY_MISMATCH'), {
                        httpStatus: 422,
                    detail: `Driver '${driver.license_category}' ≠ vehicle '${vehicle.vehicle_class}'.`
                }
                );
            if (parseFloat(cargo_weight_kg) > parseFloat(vehicle.max_load_kg)) throw Object.assign(
                new Error('CARGO_EXCEEDS_CAPACITY'), {
                    httpStatus: 422,
                detail: `${cargo_weight_kg}kg > ${vehicle.max_load_kg}kg.`
            }
            );

            // ── 4. Insert trip in 'draft' state ───────────────────
            const tripRes = await client.query(
                `INSERT INTO trips
                   (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, created_by)
                 VALUES ($1, $2, $3, 'draft', $4, $5)
                 RETURNING *`,
                [vehicle_id, driver_id, cargo_weight_kg, vehicle.odometer, performedBy]
            );
            const tripId = tripRes.rows[0].id;

            // ── 5. Atomic state transitions ───────────────────────
            //  dispatchTripInTx: vehicle→on_trip, driver→on_trip, trip→dispatched
            //  DB trigger automatically sets dispatched_at = NOW()
            await StateService.dispatchTripInTx(vehicle_id, driver_id, tripId, client, performedBy);

            // Audit trip creation
            await client.query(
                `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
                 VALUES ('trip', $1, 'trip_created', $2, $3)`,
                [tripId, performedBy, JSON.stringify({ vehicle_id, driver_id, cargo_weight_kg })]
            );

            return { ...tripRes.rows[0], status: 'dispatched' };
        });

        // Non-blocking maintenance check after commit
        StateService.checkMaintenanceAlert(vehicle_id).then(a => {
            if (a?.alert) console.warn(
                `[ALERT] Vehicle ${vehicle_id} overdue for service ` +
                `(odometer=${a.odometer} >= due=${a.service_due_km})`
            );
        }).catch(() => { });

        return res.status(201).json({ success: true, trip });

    } catch (e) {
        return _handleTripError(res, e);
    }
};

// ─────────────────────────────────────────────────────────────────
//  COMPLETE Trip
// ─────────────────────────────────────────────────────────────────
export const completeTrip = async (req, res) => {
    const { trip_id, final_odometer, liters, fuel_cost } = req.body;
    const performedBy = req.user?.id ?? null;

    try {
        await withTransaction(async (client) => {

            // Lock trip row
            const tripRes = await client.query(
                `SELECT vehicle_id, driver_id, status, start_odometer
                 FROM trips WHERE id = $1 FOR UPDATE NOWAIT`,
                [trip_id]
            );
            if (tripRes.rowCount === 0) throw Object.assign(
                new Error('TRIP_NOT_FOUND'), { httpStatus: 404 }
            );

            const { vehicle_id, driver_id, status, start_odometer } = tripRes.rows[0];

            if (status !== 'dispatched') throw Object.assign(
                new Error(`TRIP_NOT_DISPATCHED`), {
                    httpStatus: 409,
                detail: `Trip is '${status}', expected 'dispatched'.`
            }
            );
            if (parseInt(final_odometer) <= parseInt(start_odometer ?? 0)) throw Object.assign(
                new Error('INVALID_ODOMETER'), {
                    httpStatus: 422,
                detail: `final (${final_odometer}) must exceed start (${start_odometer}).`
            }
            );

            // Record fuel (DB trigger validates vehicle_id matches and trip is dispatched)
            await client.query(
                `INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost) VALUES ($1, $2, $3, $4)`,
                [trip_id, vehicle_id, liters, fuel_cost]
            );

            // Set end_odometer (DB CHECK constraint enforces > start_odometer)
            await client.query(
                `UPDATE trips SET end_odometer = $1 WHERE id = $2`,
                [final_odometer, trip_id]
            );

            // Atomic state transitions (DB trigger sets completed_at)
            await StateService.completeTripInTx(vehicle_id, driver_id, trip_id, final_odometer, client, performedBy);
        });

        return res.json({ success: true, message: 'Trip completed successfully.' });

    } catch (e) {
        return _handleTripError(res, e);
    }
};

// ─────────────────────────────────────────────────────────────────
//  CANCEL Trip
// ─────────────────────────────────────────────────────────────────
export const cancelTrip = async (req, res) => {
    const { trip_id } = req.body;
    const performedBy = req.user?.id ?? null;

    try {
        await withTransaction(async (client) => {

            const tripRes = await client.query(
                `SELECT vehicle_id, driver_id, status FROM trips WHERE id = $1 FOR UPDATE NOWAIT`,
                [trip_id]
            );
            if (tripRes.rowCount === 0) throw Object.assign(
                new Error('TRIP_NOT_FOUND'), { httpStatus: 404 }
            );

            const { vehicle_id, driver_id, status } = tripRes.rows[0];

            if (!['draft', 'dispatched'].includes(status)) throw Object.assign(
                new Error('TRIP_NOT_CANCELLABLE'), {
                    httpStatus: 409,
                detail: `Cannot cancel a '${status}' trip.`
            }
            );

            // DB trigger sets cancelled_at automatically
            await StateService.cancelTripInTx(vehicle_id, driver_id, trip_id, client, performedBy);
        });

        return res.json({ success: true, message: 'Trip cancelled. Resources released.' });

    } catch (e) {
        return _handleTripError(res, e);
    }
};

// ─────────────────────────────────────────────────────────────────
//  ERROR SHAPE NORMALIZER
//  Maps application errors → structured HTTP responses.
//  Catches PostgreSQL unique-violation from partial index (double-dispatch).
// ─────────────────────────────────────────────────────────────────
function _handleTripError(res, e) {
    // PostgreSQL unique constraint violation (double-dispatch hit the index)
    if (e.code === '23505') {
        return res.status(409).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: 'DOUBLE_DISPATCH_PREVENTED',
            detail: 'Vehicle or driver already has an active trip. Concurrent dispatch attempt rejected by database.',
        });
    }
    // Lock not available (FOR UPDATE NOWAIT — resource already locked)
    if (e.code === '55P03') {
        return res.status(409).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: 'RESOURCE_LOCKED',
            detail: 'Vehicle or driver is currently being processed by another request.',
        });
    }
    // Serialization failure (SERIALIZABLE transaction conflict)
    if (e.code === '40001') {
        return res.status(409).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: 'CONCURRENT_MODIFICATION',
            detail: 'Please retry — a concurrent transaction modified the same resources.',
        });
    }
    // Application FSM violations
    if (e.code === 'ILLEGAL_STATE_TRANSITION' || e.message?.startsWith('ILLEGAL_')) {
        return res.status(409).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: e.message,
        });
    }
    // Named domain errors with httpStatus
    const domainErrors = new Set([
        'VEHICLE_NOT_FOUND', 'DRIVER_NOT_FOUND', 'TRIP_NOT_FOUND',
        'VEHICLE_NOT_AVAILABLE', 'DRIVER_SUSPENDED', 'DRIVER_NOT_ON_DUTY',
        'LICENSE_EXPIRED', 'LICENSE_CATEGORY_MISMATCH', 'CARGO_EXCEEDS_CAPACITY',
        'TRIP_NOT_DISPATCHED', 'INVALID_ODOMETER', 'TRIP_NOT_CANCELLABLE',
    ]);
    if (domainErrors.has(e.message)) {
        return res.status(e.httpStatus ?? 422).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: e.message,
            ...(e.detail && { detail: e.detail }),
        });
    }
    // Unexpected error
    console.error('[tripController]', e.message, e.stack);
    return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        reason: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : e.message,
    });
}