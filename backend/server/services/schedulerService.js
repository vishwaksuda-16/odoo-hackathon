/**
 * Background Job Scheduler (node-cron)
 *
 * Jobs:
 *  1. Every midnight — scan vehicles for odometer-based maintenance alerts
 *  2. Every Sunday   — generate a weekly fleet health report log
 *
 * Import and call startScheduler() once in server.js.
 */

import pool from '../config/db.js';

let cron;

async function loadCron() {
    if (!cron) {
        try {
            const mod = await import('node-cron');
            cron = mod.default ?? mod;
        } catch {
            console.warn('[Scheduler] node-cron not installed — background jobs disabled.');
            cron = null;
        }
    }
    return cron;
}

// ─────────────────────────────────────────────────────────────────
//  JOB 1 — Nightly Maintenance Alert Scan (00:00 every day)
// ─────────────────────────────────────────────────────────────────
async function runMaintenanceAlertScan() {
    try {
        const { rows } = await pool.query(`
            SELECT id, name_model, license_plate, odometer, service_due_km
            FROM vehicles
            WHERE status != 'retired'
              AND deleted_at IS NULL
              AND odometer >= service_due_km
        `);

        if (rows.length === 0) {
            console.log('[Scheduler] Maintenance scan: no alerts.');
            return;
        }

        // Insert audit entries for each overdue vehicle
        for (const v of rows) {
            console.warn(
                `[MAINTENANCE ALERT] Vehicle #${v.id} (${v.license_plate}) ` +
                `odometer=${v.odometer} >= service_due=${v.service_due_km}`
            );

            // Auto-bump service_due_km by another 10,000 to avoid repeat noise
            await pool.query(
                `UPDATE vehicles SET service_due_km = service_due_km + 10000 WHERE id = $1`,
                [v.id]
            );
        }

        console.log(`[Scheduler] Maintenance scan complete. ${rows.length} vehicle(s) alerted.`);
    } catch (e) {
        console.error('[Scheduler] Maintenance scan error:', e.message);
    }
}

// ─────────────────────────────────────────────────────────────────
//  JOB 2 — Weekly Fleet Summary (every Sunday at 23:00)
// ─────────────────────────────────────────────────────────────────
async function runWeeklyFleetSummary() {
    try {
        const { rows } = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'available')  AS available,
                COUNT(*) FILTER (WHERE status = 'on_trip')    AS on_trip,
                COUNT(*) FILTER (WHERE status = 'in_shop')    AS in_shop,
                COUNT(*) FILTER (WHERE status = 'retired')    AS retired,
                COUNT(*)                                       AS total
            FROM vehicles
        `);
        console.log('[Scheduler] Weekly fleet summary:', rows[0]);
    } catch (e) {
        console.error('[Scheduler] Weekly summary error:', e.message);
    }
}

// ─────────────────────────────────────────────────────────────────
//  START — call once from server.js
// ─────────────────────────────────────────────────────────────────
export async function startScheduler() {
    const nodeCron = await loadCron();
    if (!nodeCron) return;

    // Nightly at midnight
    nodeCron.schedule('0 0 * * *', runMaintenanceAlertScan, {
        timezone: 'Asia/Kolkata',
    });

    // Weekly on Sunday at 23:00
    nodeCron.schedule('0 23 * * 0', runWeeklyFleetSummary, {
        timezone: 'Asia/Kolkata',
    });

    console.log('[Scheduler] Background jobs started.');

    // Run maintenance scan immediately on boot (for development visibility)
    if (process.env.NODE_ENV !== 'production') {
        runMaintenanceAlertScan();
    }
}
