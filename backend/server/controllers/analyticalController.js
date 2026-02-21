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

// ─────────────────────────────────────────────────────────────────
//  GET /analytics/dashboard
//  Returns full fleet snapshot in one call.
// ─────────────────────────────────────────────────────────────────
export const getDashboard = async (req, res) => {
    try {
        const [utilization, topDrivers, fuelEfficiency, costPerKm] = await Promise.all([
            getUtilizationRate(),
            getTopDriver(),
            getFuelEfficiency(),
            getCostPerKm(),
        ]);

        // Fleet-wide averages (computed from per-vehicle rows via SQL)
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

// ─────────────────────────────────────────────────────────────────
//  GET /analytics/vehicle/:id
//  In-depth stats for a single vehicle.
// ─────────────────────────────────────────────────────────────────
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

                -- Fuel metrics
                COALESCE(SUM(f.liters), 0)::NUMERIC                                AS total_liters,
                COALESCE(SUM(f.fuel_cost), 0)::NUMERIC                             AS total_fuel_cost,
                CASE WHEN SUM(f.liters) > 0
                     THEN ROUND(v.odometer / SUM(f.liters), 2) ELSE NULL END       AS km_per_liter,

                -- Maintenance metrics
                COALESCE(SUM(m.cost), 0)::NUMERIC                                  AS total_maint_cost,
                COUNT(DISTINCT m.id)::INT                                           AS maintenance_count,

                -- Trip metrics
                COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')::INT    AS completed_trips,
                COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'cancelled')::INT    AS cancelled_trips,
                COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'dispatched')::INT   AS active_trips,

                -- Cost per km
                CASE WHEN v.odometer > 0
                     THEN ROUND(
                         (COALESCE(SUM(f.fuel_cost),0)+COALESCE(SUM(m.cost),0)) / v.odometer,4)
                     ELSE NULL END                                                  AS cost_per_km,

                -- ROI (revenue @ $1.5/km, acquisition $25k)
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

        // Include last 5 maintenance entries
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

// ─────────────────────────────────────────────────────────────────
//  GET /analytics/financial/monthly?year=2025
// ─────────────────────────────────────────────────────────────────
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
                COALESCE(SUM(f.fuel_cost), 0)    AS ytd_fuel_cost,
                COALESCE(SUM(m.cost), 0)          AS ytd_maint_cost,
                COALESCE(SUM(f.fuel_cost), 0) +
                COALESCE(SUM(m.cost), 0)          AS ytd_total_cost
            FROM fuel_logs f
            FULL OUTER JOIN maintenance_logs m ON TRUE
            WHERE EXTRACT(YEAR FROM COALESCE(f.log_date, m.service_date)) = $1
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

// ─────────────────────────────────────────────────────────────────
//  Legacy endpoint (kept for backward compat)
// ─────────────────────────────────────────────────────────────────
export const getFinancialReport = async (req, res) => {
    try {
        const [fuelData, costData, roi] = await Promise.all([
            getFuelEfficiency(),
            getCostPerKm(),
            getVehicleROI(),
        ]);

        // Merge into a single per-vehicle view
        const merged = fuelData.map((f, i) => ({
            ...f,
            cost_per_km: costData[i]?.cost_per_km ?? null,
            roi: roi[i]?.roi ?? null,
        }));

        return res.json({ success: true, report: merged });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};