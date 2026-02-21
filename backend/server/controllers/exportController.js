import pool from '../config/db.js';
import { generateCSV } from '../utils/exportUtils.js';
import { calculateVehicleROI, calculateFuelEfficiency } from '../utils/analytics.js';

export const downloadFinancialCSV = async (req, res) => {
    try {
        // Logic: Aggregating all logs to link Expenses/Trips to a specific Vehicle ID [cite: 61]
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
            GROUP BY v.id, v.name_model, v.license_plate, v.odometer
        `;
        
        const result = await pool.query(query);

        // Process the data for the CSV [cite: 46]
        const processedData = result.rows.map(row => {
            const revenuePerKm = 1.5; // Business Logic: Estimated revenue
            const estimatedRevenue = row.odometer * revenuePerKm;
            
            return {
                id: row.id,
                license_plate: row.license_plate,
                total_maintenance: parseFloat(row.total_maintenance).toFixed(2),
                total_fuel: parseFloat(row.total_fuel).toFixed(2),
                roi: calculateVehicleROI(estimatedRevenue, row.total_maintenance, row.total_fuel),
                fuel_efficiency: calculateFuelEfficiency(row.odometer, row.total_liters)
            };
        });

        // Use your utility to generate the CSV string
        const csvString = generateCSV(processedData);
        
        // Logic: Provide one-click CSV download [cite: 46]
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=fleet_financial_report.csv');
        res.status(200).send(csvString);

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ error: "Failed to generate export file." });
    }
};