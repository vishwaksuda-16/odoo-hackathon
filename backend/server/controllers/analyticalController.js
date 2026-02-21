import pool from '../config/db.js';
import { calculateVehicleROI, calculateFuelEfficiency } from '../utils/analytics.js';

export const getFinancialReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id, 
                v.name_model, 
                v.license_plate,
                v.odometer,
                COALESCE(SUM(m.cost), 0) as total_maintenance,
                COALESCE(SUM(f.fuel_cost), 0) as total_fuel,
                COALESCE(SUM(f.liters), 0) as total_liters
            FROM vehicles v
            LEFT JOIN maintenance_logs m ON v.id = m.vehicle_id
            LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
            GROUP BY v.id
        `;
        
        const result = await pool.query(query);

        const report = result.rows.map(row => {
            // Mock Revenue for Hackathon: $1.5 per km driven [cite: 45]
            const estimatedRevenue = row.odometer * 1.5; 
            
            return {
                ...row,
                total_ops_cost: (parseFloat(row.total_maintenance) + parseFloat(row.total_fuel)).toFixed(2),
                fuel_efficiency: calculateFuelEfficiency(row.odometer, row.total_liters),
                roi: calculateVehicleROI(
                    estimatedRevenue, 
                    row.total_maintenance, 
                    row.total_fuel, 
                    25000 // Mock Acquisition Cost [cite: 45]
                )
            };
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate financial report." });
    }
};