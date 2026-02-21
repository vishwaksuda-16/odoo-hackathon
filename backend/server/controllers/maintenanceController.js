import pool from '../config/db.js';

export const addServiceLog = async (req, res) => {
    const { vehicle_id, cost, description, odometer_at_service } = req.body;
    try {
        await pool.query('BEGIN');
        // Log the maintenance [cite: 30]
        const log = await pool.query(
            'INSERT INTO maintenance_logs (vehicle_id, cost, description, odometer_at_service) VALUES ($1, $2, $3, $4) RETURNING *',
            [vehicle_id, cost, description, odometer_at_service]
        );
        // Auto-Logic: Status -> In Shop 
        await pool.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['in_shop', vehicle_id]);
        
        await pool.query('COMMIT');
        res.status(201).json(log.rows[0]);
    } catch (e) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
};