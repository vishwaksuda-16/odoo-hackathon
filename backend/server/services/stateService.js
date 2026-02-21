import pool, { withSerializableTransaction } from '../config/db.js';

const VEHICLE_TRANSITIONS = {
    available: ['on_trip', 'in_shop', 'retired'],
    on_trip: ['available'],
    in_shop: ['available', 'retired'],
    retired: [],
};

const DRIVER_TRANSITIONS = {
    off_duty: ['on_duty'],
    on_duty: ['on_trip', 'off_duty', 'suspended'],
    on_trip: ['on_duty'],
    suspended: [],
};

const TRIP_TRANSITIONS = {
    draft: ['dispatched', 'cancelled'],
    dispatched: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

function guard(map, entity, from, to) {
    if (!map[from]?.includes(to)) {
        const err = new Error(
            `ILLEGAL_${entity}_TRANSITION: '${from}' → '${to}' not allowed. ` +
            `Valid next states: [${map[from]?.join(', ') ?? 'none'}]`
        );
        err.code = 'ILLEGAL_STATE_TRANSITION';
        throw err;
    }
}

async function audit(db, entityType, entityId, action, performedBy, metadata) {
    try {
        await db.query(
            `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
             VALUES ($1, $2, $3, $4, $5)`,
            [entityType, entityId, action, performedBy ?? null,
                metadata ? JSON.stringify(metadata) : null]
        );
    } catch (e) {
        console.error('[StateService] audit write failed:', e.message);
    }
}

async function _transitionVehicle(vehicleId, toStatus, client, performedBy) {
    const { rows } = await client.query(
        'SELECT status FROM vehicles WHERE id = $1 FOR UPDATE NOWAIT',
        [vehicleId]
    );
    if (rows.length === 0) throw Object.assign(
        new Error(`Vehicle ${vehicleId} not found.`), { status: 404 }
    );
    guard(VEHICLE_TRANSITIONS, 'VEHICLE', rows[0].status, toStatus);
    const from = rows[0].status;
    await client.query('UPDATE vehicles SET status = $1 WHERE id = $2', [toStatus, vehicleId]);
    await audit(client, 'vehicle', vehicleId, 'vehicle_state_changed', performedBy, { from, to: toStatus });
    return { vehicleId, from, to: toStatus };
}

async function _transitionDriver(driverId, toStatus, client, performedBy) {
    const { rows } = await client.query(
        'SELECT status FROM drivers WHERE id = $1 FOR UPDATE NOWAIT',
        [driverId]
    );
    if (rows.length === 0) throw Object.assign(
        new Error(`Driver ${driverId} not found.`), { status: 404 }
    );
    guard(DRIVER_TRANSITIONS, 'DRIVER', rows[0].status, toStatus);
    const from = rows[0].status;
    await client.query('UPDATE drivers SET status = $1 WHERE id = $2', [toStatus, driverId]);
    const action = toStatus === 'suspended' ? 'driver_suspended' : 'driver_state_changed';
    await audit(client, 'driver', driverId, action, performedBy, { from, to: toStatus });
    return { driverId, from, to: toStatus };
}

async function _transitionTrip(tripId, toStatus, client, performedBy) {
    const { rows } = await client.query(
        'SELECT status FROM trips WHERE id = $1 FOR UPDATE NOWAIT',
        [tripId]
    );
    if (rows.length === 0) throw Object.assign(
        new Error(`Trip ${tripId} not found.`), { status: 404 }
    );
    guard(TRIP_TRANSITIONS, 'TRIP', rows[0].status, toStatus);
    const from = rows[0].status;
    await client.query('UPDATE trips SET status = $1 WHERE id = $2', [toStatus, tripId]);
    const actionMap = { dispatched: 'trip_dispatched', completed: 'trip_completed', cancelled: 'trip_cancelled' };
    await audit(client, 'trip', tripId, actionMap[toStatus] ?? 'trip_created', performedBy, { from, to: toStatus });
    return { tripId, from, to: toStatus };
}

export const StateService = {

    transitionVehicle: _transitionVehicle,
    transitionDriver: _transitionDriver,
    transitionTrip: _transitionTrip,

    moveToShop(vehicleId, client, performedBy = null) {
        return _transitionVehicle(vehicleId, 'in_shop', client, performedBy);
    },
    retireVehicle(vehicleId, client, performedBy = null) {
        return _transitionVehicle(vehicleId, 'retired', client, performedBy);
    },

    async dispatchTrip(vehicleId, driverId, tripId, performedBy = null) {
        return withSerializableTransaction(async (client) => {
            await _transitionVehicle(vehicleId, 'on_trip', client, performedBy);
            await _transitionDriver(driverId, 'on_trip', client, performedBy);
            await _transitionTrip(tripId, 'dispatched', client, performedBy);
        });
    },

    async dispatchTripInTx(vehicleId, driverId, tripId, client, performedBy = null) {
        await _transitionVehicle(vehicleId, 'on_trip', client, performedBy);
        await _transitionDriver(driverId, 'on_trip', client, performedBy);
        await _transitionTrip(tripId, 'dispatched', client, performedBy);
    },

    async completeTripInTx(vehicleId, driverId, tripId, newOdometer, client, performedBy = null) {
        await _transitionVehicle(vehicleId, 'available', client, performedBy);
        await client.query(
            'UPDATE vehicles SET odometer = $1 WHERE id = $2',
            [newOdometer, vehicleId]
        );
        await _transitionDriver(driverId, 'on_duty', client, performedBy);
        await _transitionTrip(tripId, 'completed', client, performedBy);
    },

    async cancelTripInTx(vehicleId, driverId, tripId, client, performedBy = null) {
        const vRes = await client.query('SELECT status FROM vehicles WHERE id = $1 FOR UPDATE NOWAIT', [vehicleId]);
        if (vRes.rows[0]?.status === 'on_trip') {
            await _transitionVehicle(vehicleId, 'available', client, performedBy);
        }
        const dRes = await client.query('SELECT status FROM drivers WHERE id = $1 FOR UPDATE NOWAIT', [driverId]);
        if (dRes.rows[0]?.status === 'on_trip') {
            await _transitionDriver(driverId, 'on_duty', client, performedBy);
        }
        await _transitionTrip(tripId, 'cancelled', client, performedBy);
    },

    async checkMaintenanceAlert(vehicleId) {
        const { rows } = await pool.query(
            'SELECT odometer, service_due_km, name_model, license_plate FROM vehicles WHERE id = $1',
            [vehicleId]
        );
        if (rows.length === 0) return null;
        const { odometer, service_due_km, name_model, license_plate } = rows[0];
        const overdue = odometer >= service_due_km;
        return { alert: overdue, vehicle: { id: vehicleId, name_model, license_plate }, odometer, service_due_km };
    },
};