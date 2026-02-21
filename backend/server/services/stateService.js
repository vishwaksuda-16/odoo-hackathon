import pool from '../config/db.js';

export const StateService = {
    /**
     * Logic: Transition vehicle to "In Shop"
     * Used when a maintenance log is created 
     */
    async moveToShop(vehicleId) {
        return await pool.query(
            'UPDATE vehicles SET status = $1 WHERE id = $2',
            ['in_shop', vehicleId]
        );
    },

    /**
     * Logic: Trip Start - Set Vehicle & Driver to "On Trip"
     * 
     */
    async startTrip(vehicleId, driverId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['on_trip', vehicleId]);
            await client.query('UPDATE drivers SET status = $1 WHERE id = $2', ['on_trip', driverId]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    /**
     * Logic: Trip Completion - Return to "available"
     * Updates odometer and releases driver 
     */
    async completeTrip(vehicleId, driverId, newOdometer) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                'UPDATE vehicles SET status = $1, odometer = $2 WHERE id = $3', 
                ['available', newOdometer, vehicleId]
            );
            await client.query(
                'UPDATE drivers SET status = $1 WHERE id = $2', 
                ['on_duty', driverId]
            );
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};