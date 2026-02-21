import pool, { withTransaction } from '../config/db.js';
import { StateService } from '../services/stateService.js';

export const createTrip = async (req, res) => {
    const { vehicle_id, driver_id, cargo_weight_kg } = req.body;
    const performedBy = req.user?.id ?? null;

    try {
        const trip = await withTransaction(async (client) => {

            const vehicleRes = await client.query(
                `SELECT id, status, max_load_kg, odometer, vehicle_class
                 FROM vehicles WHERE id = $1 FOR UPDATE NOWAIT`,
                [vehicle_id]
            );
            if (vehicleRes.rowCount === 0) throw Object.assign(
                new Error('VEHICLE_NOT_FOUND'), { httpStatus: 404 }
            );

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

            const tripRes = await client.query(
                `INSERT INTO trips
                   (vehicle_id, driver_id, cargo_weight_kg, status, start_odometer, created_by)
                 VALUES ($1, $2, $3, 'draft', $4, $5)
                 RETURNING *`,
                [vehicle_id, driver_id, cargo_weight_kg, vehicle.odometer, performedBy]
            );
            const tripId = tripRes.rows[0].id;

            await StateService.dispatchTripInTx(vehicle_id, driver_id, tripId, client, performedBy);

            await client.query(
                `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
                 VALUES ('trip', $1, 'trip_created', $2, $3)`,
                [tripId, performedBy, JSON.stringify({ vehicle_id, driver_id, cargo_weight_kg })]
            );

            return { ...tripRes.rows[0], status: 'dispatched' };
        });

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

export const completeTrip = async (req, res) => {
    const { trip_id, final_odometer, liters, fuel_cost } = req.body;
    const performedBy = req.user?.id ?? null;

    try {
        await withTransaction(async (client) => {

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

            await client.query(
                `INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost) VALUES ($1, $2, $3, $4)`,
                [trip_id, vehicle_id, liters, fuel_cost]
            );

            await client.query(
                `UPDATE trips SET end_odometer = $1 WHERE id = $2`,
                [final_odometer, trip_id]
            );

            await StateService.completeTripInTx(vehicle_id, driver_id, trip_id, final_odometer, client, performedBy);
        });

        return res.json({ success: true, message: 'Trip completed successfully.' });

    } catch (e) {
        return _handleTripError(res, e);
    }
};

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

            await StateService.cancelTripInTx(vehicle_id, driver_id, trip_id, client, performedBy);
        });

        return res.json({ success: true, message: 'Trip cancelled. Resources released.' });

    } catch (e) {
        return _handleTripError(res, e);
    }
};

function _handleTripError(res, e) {
    if (e.code === '23505') {
        return res.status(409).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: 'DOUBLE_DISPATCH_PREVENTED',
            detail: 'Vehicle or driver already has an active trip. Concurrent dispatch attempt rejected by database.',
        });
    }
    if (e.code === '55P03') {
        return res.status(409).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: 'RESOURCE_LOCKED',
            detail: 'Vehicle or driver is currently being processed by another request.',
        });
    }
    if (e.code === '40001') {
        return res.status(409).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: 'CONCURRENT_MODIFICATION',
            detail: 'Please retry — a concurrent transaction modified the same resources.',
        });
    }
    if (e.code === 'ILLEGAL_STATE_TRANSITION' || e.message?.startsWith('ILLEGAL_')) {
        return res.status(409).json({
            success: false,
            code: 'DISPATCH_BLOCKED',
            reason: e.message,
        });
    }
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
    console.error('[tripController]', e.message, e.stack);
    return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        reason: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : e.message,
    });
}