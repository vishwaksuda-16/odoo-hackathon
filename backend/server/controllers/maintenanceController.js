import pool, { withTransaction } from '../config/db.js';
import { StateService } from '../services/stateService.js';
import { AlertService } from '../services/alertService.js';

export const addServiceLog = async (req, res) => {
    const { vehicle_id, cost, description, odometer_at_service } = req.body;
    const performedBy = req.user?.id ?? null;

    if (!vehicle_id || cost === undefined || !description || odometer_at_service === undefined)
        return res.status(400).json({
            success: false,
            message: 'vehicle_id, cost, description, and odometer_at_service are required.',
        });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const log = await client.query(
            `INSERT INTO maintenance_logs
               (vehicle_id, cost, description, odometer_at_service, performed_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [vehicle_id, cost, description, odometer_at_service, performedBy]
        );

        await StateService.moveToShop(vehicle_id, client, performedBy);

        await client.query(
            `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
             VALUES ('vehicle', $1, 'maintenance_logged', $2, $3)`,
            [vehicle_id, performedBy, JSON.stringify({ cost, description, odometer_at_service })]
        );

        await client.query('COMMIT');

        AlertService.resolveOdometerAlertsForVehicle(vehicle_id).catch(() => { });
        pool.query(
            `UPDATE maintenance_alerts
             SET resolved = TRUE, resolved_at = NOW()
             WHERE vehicle_id = $1 AND alert_type = 'overdue_service' AND resolved = FALSE`,
            [vehicle_id]
        ).catch(() => { });

        return res.status(201).json({ success: true, log: log.rows[0] });

    } catch (e) {
        await client.query('ROLLBACK');
        if (e.code === 'ILLEGAL_STATE_TRANSITION' || e.message?.startsWith('ILLEGAL_'))
            return res.status(409).json({ success: false, message: e.message });
        console.error('[addServiceLog]', e.message);
        return res.status(500).json({ success: false, error: e.message });
    } finally {
        client.release();
    }
};

export const getMaintenanceLogs = async (req, res) => {
    const { vehicle_id, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const params = [];

    if (vehicle_id) {
        params.push(parseInt(vehicle_id, 10));
        conditions.push(`ml.vehicle_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const { rows } = await pool.query(
            `SELECT
                ml.*,
                v.name_model,
                v.license_plate,
                fu.username AS performed_by_name
             FROM maintenance_logs ml
             JOIN vehicles v     ON v.id = ml.vehicle_id
             LEFT JOIN fleet_users fu ON fu.id = ml.performed_by
             ${where}
             ORDER BY ml.service_date DESC, ml.id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, parseInt(limit, 10), parseInt(offset, 10)]
        );

        const { rows: total } = await pool.query(
            `SELECT COUNT(*) FROM maintenance_logs ml ${where}`,
            params
        );

        return res.json({
            success: true,
            total: parseInt(total[0].count, 10),
            logs: rows,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};