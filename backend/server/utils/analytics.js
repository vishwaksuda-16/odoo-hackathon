import pool from '../config/db.js';

export async function getMaterializedMetrics(filters = {}) {
    const conditions = ['true'];
    const params = [];

    if (filters.status) {
        params.push(filters.status);
        conditions.push(`status = $${params.length}`);
    }
    if (filters.vehicle_class) {
        params.push(filters.vehicle_class);
        conditions.push(`vehicle_class = $${params.length}`);
    }
    if (filters.maintenance_due === true) {
        conditions.push('maintenance_due = true');
    }

    const { rows } = await pool.query(
        `SELECT * FROM mv_vehicle_metrics WHERE ${conditions.join(' AND ')}
         ORDER BY vehicle_id`,
        params
    );
    return rows;
}

export async function refreshMaterializedView() {
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vehicle_metrics');
    console.log('[Analytics] Materialized view refreshed.');
}

export async function getFuelEfficiency() {
    const { rows } = await pool.query(`
        SELECT
            v.id                                      AS vehicle_id,
            v.name_model,
            v.license_plate,
            COALESCE(SUM(f.liters), 0)::NUMERIC       AS total_liters,
            v.odometer                                AS total_km,
            CASE
                WHEN COALESCE(SUM(f.liters), 0) > 0
                THEN ROUND(v.odometer / SUM(f.liters), 2)
                ELSE NULL
            END                                       AS km_per_liter
        FROM vehicles v
        LEFT JOIN fuel_logs f ON f.vehicle_id = v.id
        GROUP BY v.id, v.name_model, v.license_plate, v.odometer
        ORDER BY km_per_liter DESC NULLS LAST
    `);
    return rows;
}

export async function getCostPerKm() {
    const { rows } = await pool.query(`
        SELECT
            v.id                                          AS vehicle_id,
            v.name_model,
            v.license_plate,
            v.odometer                                    AS total_km,
            COALESCE(SUM(f.fuel_cost), 0)::NUMERIC        AS total_fuel_cost,
            COALESCE(SUM(m.cost), 0)::NUMERIC             AS total_maint_cost,
            (COALESCE(SUM(f.fuel_cost), 0) +
             COALESCE(SUM(m.cost), 0))::NUMERIC           AS total_cost,
            CASE
                WHEN v.odometer > 0
                THEN ROUND(
                    (COALESCE(SUM(f.fuel_cost), 0) + COALESCE(SUM(m.cost), 0))
                    / v.odometer, 4)
                ELSE NULL
            END                                           AS cost_per_km
        FROM vehicles v
        LEFT JOIN fuel_logs f         ON f.vehicle_id = v.id
        LEFT JOIN maintenance_logs m  ON m.vehicle_id = v.id
        GROUP BY v.id, v.name_model, v.license_plate, v.odometer
        ORDER BY cost_per_km ASC NULLS LAST
    `);
    return rows;
}

export async function getVehicleROI(revenuePerKm = 1.5, acquisitionCost = 25000) {
    const { rows } = await pool.query(`
        SELECT
            v.id,
            v.name_model,
            v.license_plate,
            v.odometer,
            ROUND(v.odometer * $1, 2)                                         AS estimated_revenue,
            COALESCE(SUM(f.fuel_cost), 0) + COALESCE(SUM(m.cost), 0)         AS operational_cost,
            CASE
                WHEN $2 > 0
                THEN ROUND(
                    ((v.odometer * $1) -
                     (COALESCE(SUM(f.fuel_cost), 0) + COALESCE(SUM(m.cost), 0)))
                    / $2, 4)
                ELSE NULL
            END                                                               AS roi
        FROM vehicles v
        LEFT JOIN fuel_logs f         ON f.vehicle_id = v.id
        LEFT JOIN maintenance_logs m  ON m.vehicle_id = v.id
        GROUP BY v.id, v.name_model, v.license_plate, v.odometer
        ORDER BY roi DESC NULLS LAST
    `, [revenuePerKm, acquisitionCost]);
    return rows;
}

export async function getUtilizationRate() {
    const { rows } = await pool.query(`
        SELECT
            COUNT(*) FILTER (WHERE status != 'retired')                   AS total_vehicles,
            COUNT(*) FILTER (WHERE status = 'on_trip')                    AS on_trip,
            COUNT(*) FILTER (WHERE status = 'available')                  AS available,
            COUNT(*) FILTER (WHERE status = 'in_shop')                    AS in_shop,
            COUNT(*) FILTER (WHERE status = 'retired')                    AS retired,
            CASE
                WHEN COUNT(*) FILTER (WHERE status != 'retired') > 0
                THEN ROUND(
                    COUNT(*) FILTER (WHERE status = 'on_trip')::NUMERIC /
                    COUNT(*) FILTER (WHERE status != 'retired') * 100, 2)
                ELSE 0
            END                                                           AS utilization_pct
        FROM vehicles
    `);
    return rows[0];
}

export async function getTopDriver() {
    const { rows } = await pool.query(`
        SELECT
            d.id,
            d.name,
            d.safety_score,
            COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_trips,
            COALESCE(SUM(
                COALESCE(t.end_odometer, 0) - COALESCE(t.start_odometer, 0)
            ), 0)                                              AS total_km_driven
        FROM drivers d
        LEFT JOIN trips t ON t.driver_id = d.id
        WHERE d.deleted_at IS NULL
        GROUP BY d.id, d.name, d.safety_score
        ORDER BY completed_trips DESC, d.safety_score DESC
        LIMIT 5
    `);
    return rows;
}

export async function getMaintenanceFrequency() {
    const { rows } = await pool.query(`
        SELECT
            v.id                    AS vehicle_id,
            v.name_model,
            v.license_plate,
            COUNT(m.id)             AS total_services,
            MIN(m.service_date)     AS first_service,
            MAX(m.service_date)     AS last_service,
            CASE
                WHEN COUNT(m.id) > 1
                THEN ROUND(
                    EXTRACT(DAY FROM (MAX(m.service_date::TIMESTAMPTZ) -
                                      MIN(m.service_date::TIMESTAMPTZ)))
                    / (COUNT(m.id) - 1), 1)
                ELSE NULL
            END                     AS avg_days_between_services,
            COALESCE(SUM(m.cost), 0) AS total_maint_cost
        FROM vehicles v
        LEFT JOIN maintenance_logs m ON m.vehicle_id = v.id
        GROUP BY v.id, v.name_model, v.license_plate
        ORDER BY total_services DESC
    `);
    return rows;
}

export async function getMonthlyFinancials(year = new Date().getFullYear()) {
    const { rows } = await pool.query(`
        SELECT
            TO_CHAR(month, 'YYYY-MM')                                  AS month,
            COALESCE(fuel.total_fuel, 0)                               AS total_fuel_cost,
            COALESCE(maint.total_maint, 0)                             AS total_maint_cost,
            COALESCE(fuel.total_liters, 0)                             AS total_liters,
            COALESCE(fuel.total_fuel, 0) + COALESCE(maint.total_maint, 0) AS total_cost
        FROM generate_series(
            DATE_TRUNC('year', $1::DATE),
            DATE_TRUNC('year', $1::DATE) + INTERVAL '11 months',
            '1 month'
        ) AS month
        LEFT JOIN (
            SELECT
                DATE_TRUNC('month', log_date::TIMESTAMPTZ) AS m,
                SUM(fuel_cost)                             AS total_fuel,
                SUM(liters)                                AS total_liters
            FROM fuel_logs
            GROUP BY m
        ) fuel ON fuel.m = month
        LEFT JOIN (
            SELECT
                DATE_TRUNC('month', service_date::TIMESTAMPTZ) AS m,
                SUM(cost)                                      AS total_maint
            FROM maintenance_logs
            GROUP BY m
        ) maint ON maint.m = month
        ORDER BY month
    `, [`${year}-01-01`]);
    return rows;
}

export const calculateFuelEfficiency = (kilometers, liters) =>
    liters > 0 ? (kilometers / liters).toFixed(2) : 0;

export const calculateVehicleROI = (revenue, maintenanceCost, fuelCost, acquisitionCost = 25000) => {
    const totalOpsCost = parseFloat(maintenanceCost) + parseFloat(fuelCost);
    const profit = revenue - totalOpsCost;
    return acquisitionCost > 0 ? (profit / acquisitionCost).toFixed(4) : 0;
};

export const calculateSafetyRisk = (driverScore, odometer) => {
    let risk = 0;
    if (driverScore < 70) risk += 40;
    if (odometer > 200000) risk += 30;
    return { score: risk, level: risk > 50 ? 'High Risk' : risk > 20 ? 'Moderate' : 'Safe' };
};