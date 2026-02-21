import pool from '../config/db.js';

export const createTrip = async (req, res) => {
    const { vehicle_id, driver_id, cargo_weight_kg } = req.body;
    try {
        await pool.query('BEGIN');
        const newTrip = await pool.query(
            'INSERT INTO trips (vehicle_id, driver_id, cargo_weight_kg, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [vehicle_id, driver_id, cargo_weight_kg, 'dispatched']
        );
        // Status Update: Vehicle & Driver -> On Trip [cite: 52]
        await pool.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['on_trip', vehicle_id]);
        await pool.query('UPDATE drivers SET status = $1 WHERE id = $2', ['on_trip', driver_id]);
        
        await pool.query('COMMIT');
        res.status(201).json(newTrip.rows[0]);
    } catch (e) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
};

export const completeTrip = async (req, res) => {
    const { trip_id, final_odometer, liters, fuel_cost } = req.body;
    try {
        await pool.query('BEGIN');
        const trip = await pool.query('SELECT vehicle_id, driver_id FROM trips WHERE id = $1', [trip_id]);
        const { vehicle_id, driver_id } = trip.rows[0];

        // Record Fuel & Cost [cite: 35, 36]
        await pool.query('INSERT INTO fuel_logs (trip_id, vehicle_id, liters, fuel_cost) VALUES ($1, $2, $3, $4)', [trip_id, vehicle_id, liters, fuel_cost]);
        
        // Status Update: Vehicle & Driver -> Available [cite: 54]
        await pool.query('UPDATE vehicles SET status = $1, odometer = $2 WHERE id = $3', ['available', final_odometer, vehicle_id]);
        await pool.query('UPDATE drivers SET status = $1 WHERE id = $2', ['on_duty', driver_id]);
        await pool.query('UPDATE trips SET status = $1, end_time = CURRENT_TIMESTAMP WHERE id = $2', ['completed', trip_id]);

        await pool.query('COMMIT');
        res.json({ message: "Trip completed successfully." });
    } catch (e) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
};