import pool from '../config/db.js';
import { refreshMaterializedView } from '../utils/analytics.js';
import { AlertService } from './alertService.js';

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

async function runOdometerAlertScan() {
    console.log('[Scheduler] → Starting odometer alert scan…');
    try {
        const result = await AlertService.runOdometerAlerts();
        console.log(`[Scheduler] Odometer scan complete — ${result.generated} alert(s) generated.`);
    } catch (e) {
        console.error('[Scheduler] Odometer scan error:', e.message);
    }
}

async function runPredictiveReminderScan() {
    console.log('[Scheduler] → Starting predictive reminder scan…');
    try {
        const result = await AlertService.runPredictiveReminders();
        console.log(
            `[Scheduler] Predictive scan complete — ${result.generated} alert(s) generated.`,
            result.breakdown
        );
    } catch (e) {
        console.error('[Scheduler] Predictive reminder error:', e.message);
    }
}

async function runMVRefresh() {
    console.log('[Scheduler] → Refreshing materialized view…');
    try {
        await refreshMaterializedView();
        console.log('[Scheduler] Materialized view refreshed.');
    } catch (e) {
        console.error('[Scheduler] MV refresh error:', e.message);
    }
}

async function runWeeklyFleetSummary() {
    console.log('[Scheduler] → Generating weekly fleet summary…');
    try {
        const { rows: status } = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'available') AS available,
                COUNT(*) FILTER (WHERE status = 'on_trip')   AS on_trip,
                COUNT(*) FILTER (WHERE status = 'in_shop')   AS in_shop,
                COUNT(*) FILTER (WHERE status = 'retired')   AS retired,
                COUNT(*)                                      AS total
            FROM vehicles
        `);

        const alertBreakdown = await AlertService.getAlertSummary();

        const critical = alertBreakdown.filter(r => r.severity === 'critical').reduce((s, r) => s + parseInt(r.count, 10), 0);
        const warning = alertBreakdown.filter(r => r.severity === 'warning').reduce((s, r) => s + parseInt(r.count, 10), 0);

        console.log('[Scheduler] ┌─ Weekly Fleet Summary ─────────────────────────────');
        console.log('[Scheduler] │ Fleet status  :', status[0]);
        console.log('[Scheduler] │ Open alerts   :', { critical, warning, breakdown: alertBreakdown });
        console.log('[Scheduler] └───────────────────────────────────────────────────');
    } catch (e) {
        console.error('[Scheduler] Weekly summary error:', e.message);
    }
}

export async function startScheduler() {
    const nodeCron = await loadCron();
    if (!nodeCron) return;

    const TZ = { timezone: 'Asia/Kolkata' };

    nodeCron.schedule('0 0 * * *', runOdometerAlertScan, TZ);
    nodeCron.schedule('30 0 * * *', runPredictiveReminderScan, TZ);
    nodeCron.schedule('0 1 * * *', runMVRefresh, TZ);
    nodeCron.schedule('0 23 * * 0', runWeeklyFleetSummary, TZ);

    console.log('[Scheduler] Background jobs started:');
    console.log('  • 00:00 daily  → Odometer alert scan');
    console.log('  • 00:30 daily  → Predictive reminder scan');
    console.log('  • 01:00 daily  → Materialized view refresh');
    console.log('  • Sun 23:00    → Weekly fleet summary');

    if (process.env.NODE_ENV !== 'production') {
        console.log('[Scheduler] DEV mode: running all jobs immediately…');
        runOdometerAlertScan();
        setTimeout(runPredictiveReminderScan, 2000);
        refreshMaterializedView().catch(() => { });
    }
}

export const SchedulerJobs = {
    runOdometerAlertScan,
    runPredictiveReminderScan,
    runWeeklyFleetSummary,
    runMVRefresh,
};
