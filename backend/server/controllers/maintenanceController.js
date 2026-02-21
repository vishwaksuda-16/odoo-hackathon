import pool from '../config/db.js';
import { StateService } from '../services/stateService.js';

export const addServiceLog = async (req, res) => {
    const { vehicle_id, cost, description, odometer_at_service } = req.body;
    const performedBy = req.user?.id ?? null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert maintenance log
        const log = await client.query(
            `INSERT INTO maintenance_logs
               (vehicle_id, cost, description, odometer_at_service, performed_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [vehicle_id, cost, description, odometer_at_service, performedBy]
        );

        // Transition vehicle → in_shop via StateService (validates current state)
        await StateService.moveToShop(vehicle_id, client, performedBy);

        // Audit log
        await client.query(
            `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
             VALUES ('vehicle', $1, 'maintenance_logged', $2, $3)`,
            [vehicle_id, performedBy, JSON.stringify({ cost, description, odometer_at_service })]
        );

        await client.query('COMMIT');
        return res.status(201).json({ success: true, log: log.rows[0] });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('[addServiceLog]', e.message);
        return res.status(500).json({ success: false, error: e.message });
    } finally {
        client.release();
    }
};