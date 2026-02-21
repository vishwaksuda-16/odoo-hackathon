import pool from '../config/db.js';
import {
    getFuelEfficiency,
    getCostPerKm,
    getVehicleROI,
    getUtilizationRate,
    getTopDriver,
    getMaintenanceFrequency,
    getMonthlyFinancials,
} from '../utils/analytics.js';

export const getDashboard = async (req, res) => {
    try {
        const [utilization, topDrivers, fuelEfficiency, costPerKm] = await Promise.all([
            getUtilizationRate(),
            getTopDriver(),
            getFuelEfficiency(),
            getCostPerKm(),
        ]);

        const { rows: fleetAvg } = await pool.query(`
            SELECT
                ROUND(AVG(km_per_liter), 2)   AS avg_fuel_efficiency,
                ROUND(AVG(cost_per_km), 4)    AS avg_cost_per_km
            FROM (
                SELECT
                    v.id,
                    CASE WHEN SUM(f.liters) > 0
                         THEN v.odometer / SUM(f.liters) ELSE NULL END AS km_per_liter,
                    CASE WHEN v.odometer > 0
                         THEN (COALESCE(SUM(f.fuel_cost),0)+COALESCE(SUM(m.cost),0)) / v.odometer
                         ELSE NULL END AS cost_per_km
                FROM vehicles v
                LEFT JOIN fuel_logs f        ON f.vehicle_id = v.id
                LEFT JOIN maintenance_logs m ON m.vehicle_id = v.id
                GROUP BY v.id, v.odometer
            ) sub
        `);

        return res.json({
            success: true,
            data: {
                fleet_utilization: utilization,
                fleet_averages: fleetAvg[0],
                top_drivers: topDrivers,
                vehicles_fuel: fuelEfficiency.slice(0, 10),
                vehicles_cost_per_km: costPerKm.slice(0, 10),
            },
        });
    } catch (error) {
        console.error('[getDashboard]', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getVehicleAnalytics = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query(`
            SELECT
                v.id,
                v.name_model,
                v.license_plate,
                v.status,
                v.odometer,
                v.service_due_km,
                v.odometer >= v.service_due_km                                     AS maintenance_due,

                COALESCE(SUM(f.liters), 0)::NUMERIC                                AS total_liters,
                COALESCE(SUM(f.fuel_cost), 0)::NUMERIC                             AS total_fuel_cost,
                CASE WHEN SUM(f.liters) > 0
                     THEN ROUND(v.odometer / SUM(f.liters), 2) ELSE NULL END       AS km_per_liter,

                COALESCE(SUM(m.cost), 0)::NUMERIC                                  AS total_maint_cost,
                COUNT(DISTINCT m.id)::INT                                           AS maintenance_count,

                COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')::INT    AS completed_trips,
                COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'cancelled')::INT    AS cancelled_trips,
                COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'dispatched')::INT   AS active_trips,

                CASE WHEN v.odometer > 0
                     THEN ROUND(
                         (COALESCE(SUM(f.fuel_cost),0)+COALESCE(SUM(m.cost),0)) / v.odometer,4)
                     ELSE NULL END                                                  AS cost_per_km,

                ROUND(v.odometer * 1.5, 2)                                         AS estimated_revenue,
                ROUND(
                    (v.odometer * 1.5 -
                     COALESCE(SUM(f.fuel_cost),0) - COALESCE(SUM(m.cost),0)
                    ) / 25000.0, 4)                                                AS roi

            FROM vehicles v
            LEFT JOIN fuel_logs f         ON f.vehicle_id = v.id
            LEFT JOIN maintenance_logs m  ON m.vehicle_id = v.id
            LEFT JOIN trips t             ON t.vehicle_id = v.id
            WHERE v.id = $1
            GROUP BY v.id, v.name_model, v.license_plate, v.status,
                     v.odometer, v.service_due_km
        `, [id]);

        if (rows.length === 0)
            return res.status(404).json({ success: false, error: 'Vehicle not found.' });

        const { rows: mLog } = await pool.query(`
            SELECT service_date, cost, description, odometer_at_service
            FROM maintenance_logs
            WHERE vehicle_id = $1
            ORDER BY service_date DESC LIMIT 5
        `, [id]);

        return res.json({ success: true, data: { ...rows[0], recent_maintenance: mLog } });

    } catch (error) {
        console.error('[getVehicleAnalytics]', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getMonthlyFinancialReport = async (req, res) => {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    try {
        const [monthly, maintFreq, roi] = await Promise.all([
            getMonthlyFinancials(year),
            getMaintenanceFrequency(),
            getVehicleROI(),
        ]);

        const { rows: totals } = await pool.query(`
            SELECT
                COALESCE(f.ytd_fuel_cost, 0)  AS ytd_fuel_cost,
                COALESCE(m.ytd_maint_cost, 0) AS ytd_maint_cost,
                COALESCE(f.ytd_fuel_cost, 0) + COALESCE(m.ytd_maint_cost, 0) AS ytd_total_cost
            FROM (
                SELECT SUM(fuel_cost) AS ytd_fuel_cost
                FROM fuel_logs
                WHERE EXTRACT(YEAR FROM log_date) = $1
            ) f
            CROSS JOIN (
                SELECT SUM(cost) AS ytd_maint_cost
                FROM maintenance_logs
                WHERE EXTRACT(YEAR FROM service_date) = $1
            ) m
        `, [year]);

        return res.json({
            success: true,
            year,
            data: {
                monthly_breakdown: monthly,
                ytd_summary: totals[0],
                maintenance_frequency: maintFreq,
                vehicle_roi: roi,
            },
        });
    } catch (error) {
        console.error('[getMonthlyFinancialReport]', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getFinancialReport = async (req, res) => {
    try {
        const [fuelData, costData, roi] = await Promise.all([
            getFuelEfficiency(),
            getCostPerKm(),
            getVehicleROI(),
        ]);

        // Build lookup maps by vehicle_id for safe merge
        const costMap = Object.fromEntries(costData.map(c => [c.vehicle_id, c]));
        const roiMap = Object.fromEntries(roi.map(r => [r.id, r]));

        const merged = fuelData.map(f => ({
            ...f,
            total_fuel_cost: costMap[f.vehicle_id]?.total_fuel_cost ?? 0,
            total_maint_cost: costMap[f.vehicle_id]?.total_maint_cost ?? 0,
            total_cost: costMap[f.vehicle_id]?.total_cost ?? 0,
            cost_per_km: costMap[f.vehicle_id]?.cost_per_km ?? null,
            roi: roiMap[f.vehicle_id]?.roi ?? null,
        }));

        return res.json({ success: true, report: merged });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};