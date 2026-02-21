import pool from '../config/db.js';

const THRESHOLDS = {
    OVERDUE_SERVICE_DAYS: 90,
    HIGH_USAGE_KM_PER_DAY: 250,
    USAGE_RATE_WINDOW_DAYS: 30,
    OVERLOAD_TRIP_COUNT: 3,
    LICENSE_EXPIRY_WARNING_DAYS: 30,
    ODOMETER_EARLY_WARNING_KM: 1000,
};

async function alertExistsToday(client, { vehicleId, driverId, alertType }) {
    const { rows } = await client.query(
        `SELECT 1 FROM maintenance_alerts
         WHERE alert_type = $1
           AND resolved   = FALSE
           AND (
               ($2::INT IS NOT NULL AND vehicle_id = $2)
               OR ($3::INT IS NOT NULL AND driver_id = $3)
           )
           AND created_at >= NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [alertType, vehicleId ?? null, driverId ?? null]
    );
    return rows.length > 0;
}

async function createAlert(client, {
    vehicleId = null,
    driverId = null,
    alertType,
    severity = 'warning',
    message,
    metadata = {},
}) {
    const exists = await alertExistsToday(client, { vehicleId, driverId, alertType });
    if (exists) return null;

    const { rows } = await client.query(
        `INSERT INTO maintenance_alerts
           (vehicle_id, driver_id, alert_type, severity, message, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [vehicleId, driverId, alertType, severity, message, JSON.stringify(metadata)]
    );

    const alert = rows[0];

    try {
        await client.query(
            `INSERT INTO audit_logs
               (entity_type, entity_id, action, performed_by, metadata)
             VALUES ($1, $2, 'alert_created', NULL, $3)`,
            [
                vehicleId ? 'vehicle' : 'driver',
                vehicleId ?? driverId,
                JSON.stringify({ alertType, severity, message }),
            ]
        );
    } catch (auditErr) {
        console.warn('[AlertService] audit write failed:', auditErr.message);
    }

    return alert;
}

async function _runOdometerAlerts(client) {
    let count = 0;

    const { rows: overdue } = await client.query(`
        SELECT id, name_model, license_plate, odometer, service_due_km
        FROM   vehicles
        WHERE  status   != 'retired'
          AND  deleted_at IS NULL
          AND  odometer >= service_due_km
    `);

    for (const v of overdue) {
        const msg =
            `Vehicle ${v.name_model} (${v.license_plate}) has reached ` +
            `${v.odometer.toLocaleString()} km — service was due at ${v.service_due_km.toLocaleString()} km.`;

        const alert = await createAlert(client, {
            vehicleId: v.id,
            alertType: 'odometer_threshold',
            severity: 'critical',
            message: msg,
            metadata: { odometer: v.odometer, service_due_km: v.service_due_km },
        });

        if (alert) {
            console.warn(`[AlertService][CRITICAL] ${msg}`);
            await client.query(
                `UPDATE vehicles SET service_due_km = service_due_km + 10000 WHERE id = $1`,
                [v.id]
            );
            count++;
        }
    }

    const { rows: approaching } = await client.query(`
        SELECT id, name_model, license_plate, odometer, service_due_km
        FROM   vehicles
        WHERE  status   != 'retired'
          AND  deleted_at IS NULL
          AND  odometer < service_due_km
          AND  odometer >= service_due_km - $1
    `, [THRESHOLDS.ODOMETER_EARLY_WARNING_KM]);

    for (const v of approaching) {
        const remaining = v.service_due_km - v.odometer;
        const msg =
            `Vehicle ${v.name_model} (${v.license_plate}) is ${remaining.toLocaleString()} km ` +
            `away from its next service (due at ${v.service_due_km.toLocaleString()} km).`;

        const alert = await createAlert(client, {
            vehicleId: v.id,
            alertType: 'odometer_threshold',
            severity: 'warning',
            message: msg,
            metadata: { odometer: v.odometer, service_due_km: v.service_due_km, remaining_km: remaining },
        });

        if (alert) {
            console.log(`[AlertService][WARNING] ${msg}`);
            count++;
        }
    }

    return count;
}

async function _runOverdueServiceAlerts(client) {
    let count = 0;

    const { rows } = await client.query(`
        SELECT
            v.id,
            v.name_model,
            v.license_plate,
            MAX(m.service_date) AS last_service
        FROM   vehicles v
        LEFT JOIN maintenance_logs m ON m.vehicle_id = v.id
        WHERE  v.status   != 'retired'
          AND  v.deleted_at IS NULL
        GROUP BY v.id
        HAVING
            MAX(m.service_date) IS NULL
            OR MAX(m.service_date) < CURRENT_DATE - INTERVAL '1 day' * $1
    `, [THRESHOLDS.OVERDUE_SERVICE_DAYS]);

    for (const v of rows) {
        const daysAgo = v.last_service
            ? Math.floor((Date.now() - new Date(v.last_service).getTime()) / 86400000)
            : null;

        const msg = v.last_service
            ? `Vehicle ${v.name_model} (${v.license_plate}) last serviced ${daysAgo} days ago — ` +
            `overdue by ${daysAgo - THRESHOLDS.OVERDUE_SERVICE_DAYS} days.`
            : `Vehicle ${v.name_model} (${v.license_plate}) has never been serviced.`;

        const severity = !v.last_service || daysAgo > THRESHOLDS.OVERDUE_SERVICE_DAYS * 1.5
            ? 'critical' : 'warning';

        const alert = await createAlert(client, {
            vehicleId: v.id,
            alertType: 'overdue_service',
            severity,
            message: msg,
            metadata: { last_service: v.last_service, days_since: daysAgo },
        });

        if (alert) {
            console.log(`[AlertService][OVERDUE] ${msg}`);
            count++;
        }
    }

    return count;
}

async function _runHighUsageAlerts(client) {
    let count = 0;
    const window = THRESHOLDS.USAGE_RATE_WINDOW_DAYS;

    const { rows } = await client.query(`
        SELECT
            v.id,
            v.name_model,
            v.license_plate,
            v.odometer,
            COALESCE(SUM(t.end_odometer - t.start_odometer)
                FILTER (
                    WHERE t.status = 'completed'
                      AND t.completed_at >= NOW() - INTERVAL '1 day' * $1
                      AND t.end_odometer IS NOT NULL
                      AND t.start_odometer IS NOT NULL
                ), 0) AS km_in_window,
            COUNT(t.id)
                FILTER (
                    WHERE t.status = 'completed'
                      AND t.completed_at >= NOW() - INTERVAL '1 day' * $1
                ) AS trip_count_in_window
        FROM vehicles v
        LEFT JOIN trips t ON t.vehicle_id = v.id
        WHERE v.status != 'retired'
          AND v.deleted_at IS NULL
        GROUP BY v.id
        HAVING
            COALESCE(SUM(t.end_odometer - t.start_odometer)
                FILTER (
                    WHERE t.status = 'completed'
                      AND t.completed_at >= NOW() - INTERVAL '1 day' * $1
                      AND t.end_odometer IS NOT NULL
                      AND t.start_odometer IS NOT NULL
                ), 0) / $1::NUMERIC >= $2
    `, [window, THRESHOLDS.HIGH_USAGE_KM_PER_DAY]);

    for (const v of rows) {
        const kmPerDay = Math.round(v.km_in_window / window);
        const msg =
            `Vehicle ${v.name_model} (${v.license_plate}) is averaging ` +
            `${kmPerDay} km/day over the last ${window} days — ` +
            `consider an early service inspection.`;

        const alert = await createAlert(client, {
            vehicleId: v.id,
            alertType: 'high_usage_rate',
            severity: 'warning',
            message: msg,
            metadata: { km_in_window: v.km_in_window, km_per_day: kmPerDay, window_days: window },
        });

        if (alert) {
            console.log(`[AlertService][HIGH_USAGE] ${msg}`);
            count++;
        }
    }

    return count;
}

async function _runOverloadAlerts(client) {
    let count = 0;

    const { rows } = await client.query(`
        SELECT
            v.id,
            v.name_model,
            v.license_plate,
            v.max_load_kg,
            COUNT(t.id) FILTER (
                WHERE t.cargo_weight_kg > v.max_load_kg
                  AND t.status IN ('completed', 'dispatched')
                  AND t.created_at >= NOW() - INTERVAL '30 days'
            ) AS overload_count
        FROM vehicles v
        LEFT JOIN trips t ON t.vehicle_id = v.id
        WHERE v.status != 'retired'
          AND v.deleted_at IS NULL
        GROUP BY v.id
        HAVING COUNT(t.id) FILTER (
            WHERE t.cargo_weight_kg > v.max_load_kg
              AND t.status IN ('completed', 'dispatched')
              AND t.created_at >= NOW() - INTERVAL '30 days'
        ) >= $1
    `, [THRESHOLDS.OVERLOAD_TRIP_COUNT]);

    for (const v of rows) {
        const msg =
            `Vehicle ${v.name_model} (${v.license_plate}) has had ${v.overload_count} overloaded ` +
            `trip(s) in the last 30 days (max load: ${v.max_load_kg} kg). ` +
            `Mechanical inspection recommended.`;

        const alert = await createAlert(client, {
            vehicleId: v.id,
            alertType: 'overload_trips',
            severity: 'warning',
            message: msg,
            metadata: { overload_count: v.overload_count, max_load_kg: v.max_load_kg },
        });

        if (alert) {
            console.log(`[AlertService][OVERLOAD] ${msg}`);
            count++;
        }
    }

    return count;
}

async function _runLicenseExpiryAlerts(client) {
    let count = 0;

    const { rows } = await client.query(`
        SELECT id, name, license_expiry,
               (license_expiry - CURRENT_DATE) AS days_remaining
        FROM   drivers
        WHERE  deleted_at IS NULL
          AND  status     != 'suspended'
          AND  license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * $1
    `, [THRESHOLDS.LICENSE_EXPIRY_WARNING_DAYS]);

    for (const d of rows) {
        const daysRemaining = parseInt(d.days_remaining, 10);
        const severity = daysRemaining <= 7 ? 'critical' : 'warning';
        const msg =
            `Driver ${d.name}'s license expires in ${daysRemaining} day(s) ` +
            `(${new Date(d.license_expiry).toDateString()}). Renewal required.`;

        const alert = await createAlert(client, {
            driverId: d.id,
            alertType: 'license_expiry_warning',
            severity,
            message: msg,
            metadata: { license_expiry: d.license_expiry, days_remaining: daysRemaining },
        });

        if (alert) {
            console.log(`[AlertService][LICENSE] ${msg}`);
            count++;
        }
    }

    return count;
}

export const AlertService = {

    async runOdometerAlerts() {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const generated = await _runOdometerAlerts(client);
            await client.query('COMMIT');
            console.log(`[AlertService] Odometer scan done — ${generated} alert(s) generated.`);
            return { generated };
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('[AlertService] Odometer scan error:', e.message);
            throw e;
        } finally {
            client.release();
        }
    },

    async runPredictiveReminders() {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const [overdue, highUsage, overload, license] = await Promise.all([
                _runOverdueServiceAlerts(client),
                _runHighUsageAlerts(client),
                _runOverloadAlerts(client),
                _runLicenseExpiryAlerts(client),
            ]);

            await client.query('COMMIT');

            const total = overdue + highUsage + overload + license;
            const breakdown = { overdue_service: overdue, high_usage_rate: highUsage, overload_trips: overload, license_expiry: license };
            console.log(`[AlertService] Predictive scan done — ${total} alert(s).`, breakdown);
            return { generated: total, breakdown };

        } catch (e) {
            await client.query('ROLLBACK');
            console.error('[AlertService] Predictive scan error:', e.message);
            throw e;
        } finally {
            client.release();
        }
    },

    async acknowledgeAlert(alertId, userId) {
        const { rows } = await pool.query(
            `UPDATE maintenance_alerts
             SET acknowledged = TRUE, acknowledged_at = NOW()
             WHERE id = $1 AND acknowledged = FALSE
             RETURNING *`,
            [alertId]
        );
        if (rows.length === 0) return null;

        pool.query(
            `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
             VALUES ('vehicle', $1, 'alert_dismissed', $2, $3)`,
            [
                rows[0].vehicle_id ?? rows[0].driver_id,
                userId ?? null,
                JSON.stringify({ alert_id: alertId }),
            ]
        ).catch(() => { });

        return rows[0];
    },

    async resolveAlert(alertId) {
        const { rows } = await pool.query(
            `UPDATE maintenance_alerts
             SET resolved = TRUE, resolved_at = NOW()
             WHERE id = $1 AND resolved = FALSE
             RETURNING *`,
            [alertId]
        );
        return rows[0] ?? null;
    },

    async resolveOdometerAlertsForVehicle(vehicleId) {
        await pool.query(
            `UPDATE maintenance_alerts
             SET resolved = TRUE, resolved_at = NOW()
             WHERE vehicle_id = $1
               AND alert_type = 'odometer_threshold'
               AND resolved   = FALSE`,
            [vehicleId]
        );
    },

    async getActiveAlerts({ vehicleId, driverId, alertType, severity, limit = 50 } = {}) {
        const { rows } = await pool.query(
            `SELECT
                ma.*,
                v.name_model  AS vehicle_name,
                v.license_plate,
                d.name        AS driver_name
             FROM maintenance_alerts ma
             LEFT JOIN vehicles v ON v.id = ma.vehicle_id
             LEFT JOIN drivers  d ON d.id = ma.driver_id
             WHERE ma.resolved = FALSE
               AND ($1::INT IS NULL  OR ma.vehicle_id  = $1)
               AND ($2::INT IS NULL  OR ma.driver_id   = $2)
               AND ($3::TEXT IS NULL OR ma.alert_type::TEXT = $3)
               AND ($4::TEXT IS NULL OR ma.severity::TEXT   = $4)
             ORDER BY
                CASE ma.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
                ma.created_at DESC
             LIMIT $5`,
            [vehicleId ?? null, driverId ?? null, alertType ?? null, severity ?? null, limit]
        );
        return rows;
    },

    async getAlertSummary() {
        const { rows } = await pool.query(`
            SELECT
                alert_type,
                severity,
                COUNT(*) AS count
            FROM maintenance_alerts
            WHERE resolved = FALSE
            GROUP BY alert_type, severity
            ORDER BY
                CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
                alert_type
        `);
        return rows;
    },

    THRESHOLDS,
};
