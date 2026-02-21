import pool from '../config/db.js';

export const validateTripAssignment = async (req, res, next) => {
    const { vehicle_id, driver_id, cargo_weight_kg } = req.body;

    try {
        const vehicleRes = await pool.query('SELECT max_load_kg, status FROM vehicles WHERE id = $1', [vehicle_id]);
        const driverRes = await pool.query('SELECT license_expiry, status FROM drivers WHERE id = $1', [driver_id]);

        if (vehicleRes.rowCount === 0 || driverRes.rowCount === 0) {
            return res.status(404).json({ error: "Vehicle or Driver not found." });
        }

        const vehicle = vehicleRes.rows[0];
        const driver = driverRes.rows[0];

        // Logic: Prevent trip if CargoWeight > MaxCapacity 
        if (parseFloat(cargo_weight_kg) > parseFloat(vehicle.max_load_kg)) {
            return res.status(400).json({ error: `Validation Failed: Cargo (${cargo_weight_kg}kg) exceeds vehicle capacity (${vehicle.max_load_kg}kg).` });
        }

        // Logic: Block assignment if license is expired 
        if (new Date(driver.license_expiry) < new Date()) {
            return res.status(400).json({ error: "Validation Failed: Driver license has expired." });
        }

        // Logic: Availability Check [cite: 32]
        if (vehicle.status === 'in_shop') {
            return res.status(400).json({ error: "Validation Failed: Vehicle is currently in shop for maintenance." });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: "Internal validation error." });
    }
};