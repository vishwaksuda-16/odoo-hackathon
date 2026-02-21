import pool from '../config/db.js';

// ─────────────────────────────────────────────────────────────────
//  FINITE STATE MACHINE — TRANSITION ALLOWLISTS
// ─────────────────────────────────────────────────────────────────
const VEHICLE_TRANSITIONS = {
    available: ['on_trip', 'in_shop', 'retired'],
    on_trip: ['available'],
    in_shop: ['available', 'retired'],
    retired: [],                   // terminal — no exit
};

const DRIVER_TRANSITIONS = {
    off_duty: ['on_duty'],
    on_duty: ['on_trip', 'off_duty', 'suspended'],
    on_trip: ['on_duty'],
    suspended: [],                   // terminal — admin must reset
};

const TRIP_TRANSITIONS = {
    draft: ['dispatched', 'cancelled'],
    dispatched: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

// ─────────────────────────────────────────────────────────────────
//  GUARD HELPERS — throw on invalid transition
// ─────────────────────────────────────────────────────────────────
function guard(map, entity, from, to) {
    if (!map[from]?.includes(to)) {
        throw new Error(
            `ILLEGAL_${entity}_TRANSITION: '${from}' → '${to}'. ` +
            `Allowed: [${map[from]?.join(', ') ?? 'none'}]`
        );
    }
}

// ─────────────────────────────────────────────────────────────────
//  AUDIT LOGGER — writes to audit_logs within the same client
// ─────────────────────────────────────────────────────────────────
async function audit(client, entityType, entityId, action, performedBy = null, metadata = null) {
    await client.query(
        `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [entityType, entityId, action, performedBy, metadata ? JSON.stringify(metadata) : null]
    );
}

// ─────────────────────────────────────────────────────────────────
//  SERVICE API
//  All methods accept an optional `client` (pg.PoolClient) so they
//  participate in the caller's transaction. If none is passed, a
//  standalone query is issued (no transaction guarantee).
// ─────────────────────────────────────────────────────────────────
export const StateService = {

    // ── VEHICLE ──────────────────────────────────────────────────

    async transitionVehicle(vehicleId, toStatus, client = null, performedBy = null) {
        const db = client ?? pool;
        const { rows } = await db.query(
            'SELECT status FROM vehicles WHERE id = $1 FOR UPDATE',
            [vehicleId]
        );
        if (rows.length === 0) throw new Error(`Vehicle ${vehicleId} not found.`);
        guard(VEHICLE_TRANSITIONS, 'VEHICLE', rows[0].status, toStatus);

        await db.query('UPDATE vehicles SET status = $1 WHERE id = $2', [toStatus, vehicleId]);

        await audit(db, 'vehicle', vehicleId, 'vehicle_state_changed', performedBy,
            { from: rows[0].status, to: toStatus });

        return { vehicleId, from: rows[0].status, to: toStatus };
    },

    async moveToShop(vehicleId, client = null, performedBy = null) {
        return this.transitionVehicle(vehicleId, 'in_shop', client, performedBy);
    },

    async retireVehicle(vehicleId, client = null, performedBy = null) {
        const result = await this.transitionVehicle(vehicleId, 'retired', client, performedBy);
        const db = client ?? pool;
        await audit(db, 'vehicle', vehicleId, 'vehicle_retired', performedBy, {});
        return result;
    },

    // ── DRIVER ───────────────────────────────────────────────────

    async transitionDriver(driverId, toStatus, client = null, performedBy = null) {
        const db = client ?? pool;
        const { rows } = await db.query(
            'SELECT status FROM drivers WHERE id = $1 FOR UPDATE',
            [driverId]
        );
        if (rows.length === 0) throw new Error(`Driver ${driverId} not found.`);
        guard(DRIVER_TRANSITIONS, 'DRIVER', rows[0].status, toStatus);

        await db.query('UPDATE drivers SET status = $1 WHERE id = $2', [toStatus, driverId]);

        const action = toStatus === 'suspended' ? 'driver_suspended' : 'driver_state_changed';
        await audit(db, 'driver', driverId, action, performedBy,
            { from: rows[0].status, to: toStatus });

        return { driverId, from: rows[0].status, to: toStatus };
    },

    // ── TRIP ─────────────────────────────────────────────────────

    async transitionTrip(tripId, toStatus, client = null, performedBy = null) {
        const db = client ?? pool;
        const { rows } = await db.query(
            'SELECT status FROM trips WHERE id = $1 FOR UPDATE',
            [tripId]
        );
        if (rows.length === 0) throw new Error(`Trip ${tripId} not found.`);
        guard(TRIP_TRANSITIONS, 'TRIP', rows[0].status, toStatus);

        await db.query('UPDATE trips SET status = $1 WHERE id = $2', [toStatus, tripId]);

        const actionMap = {
            dispatched: 'trip_dispatched',
            completed: 'trip_completed',
            cancelled: 'trip_cancelled',
        };
        await audit(db, 'trip', tripId, actionMap[toStatus] ?? 'trip_created', performedBy,
            { from: rows[0].status, to: toStatus });

        return { tripId, from: rows[0].status, to: toStatus };
    },

    // ── COMPOUND ─────────────────────────────────────────────────

    /**
     * Dispatch: vehicle available→on_trip, driver on_duty→on_trip.
     * Caller owns the transaction (client required).
     */
    async dispatchTrip(vehicleId, driverId, tripId, client, performedBy = null) {
        await this.transitionVehicle(vehicleId, 'on_trip', client, performedBy);
        await this.transitionDriver(driverId, 'on_trip', client, performedBy);
        await this.transitionTrip(tripId, 'dispatched', client, performedBy);
    },

    /**
     * Complete: vehicle on_trip→available (+odometer), driver on_trip→on_duty.
     * Caller owns the transaction (client required).
     */
    async completeTrip(vehicleId, driverId, tripId, newOdometer, client, performedBy = null) {
        await this.transitionVehicle(vehicleId, 'available', client, performedBy);
        await client.query('UPDATE vehicles SET odometer = $1 WHERE id = $2', [newOdometer, vehicleId]);
        await this.transitionDriver(driverId, 'on_duty', client, performedBy);
        await this.transitionTrip(tripId, 'completed', client, performedBy);
    },

    /**
     * Cancel a trip: returns vehicle & driver to their pre-trip states.
     */
    async cancelTrip(vehicleId, driverId, tripId, client, performedBy = null) {
        // Vehicle may be 'on_trip' or still 'available' (if cancelled before dispatch)
        const vRes = await client.query('SELECT status FROM vehicles WHERE id = $1', [vehicleId]);
        if (vRes.rows[0]?.status === 'on_trip') {
            await this.transitionVehicle(vehicleId, 'available', client, performedBy);
        }
        const dRes = await client.query('SELECT status FROM drivers WHERE id = $1', [driverId]);
        if (dRes.rows[0]?.status === 'on_trip') {
            await this.transitionDriver(driverId, 'on_duty', client, performedBy);
        }
        await this.transitionTrip(tripId, 'cancelled', client, performedBy);
    },

    // ── HELPERS ──────────────────────────────────────────────────

    /** Check if a vehicle's odometer has crossed its service_due_km threshold */
    async checkMaintenanceAlert(vehicleId) {
        const { rows } = await pool.query(
            'SELECT odometer, service_due_km FROM vehicles WHERE id = $1',
            [vehicleId]
        );
        if (rows.length === 0) return null;
        const { odometer, service_due_km } = rows[0];
        return odometer >= service_due_km
            ? { alert: true, odometer, service_due_km }
            : { alert: false };
    },
};