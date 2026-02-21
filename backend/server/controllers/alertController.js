import { AlertService } from '../services/alertService.js';
import { SchedulerJobs } from '../services/schedulerService.js';

export const getAlerts = async (req, res) => {
    try {
        const {
            vehicle_id,
            driver_id,
            alert_type,
            severity,
            limit = 50,
        } = req.query;

        const alerts = await AlertService.getActiveAlerts({
            vehicleId: vehicle_id ? parseInt(vehicle_id, 10) : undefined,
            driverId: driver_id ? parseInt(driver_id, 10) : undefined,
            alertType: alert_type || undefined,
            severity: severity || undefined,
            limit: Math.min(parseInt(limit, 10) || 50, 200),
        });

        return res.json({ success: true, count: alerts.length, alerts });
    } catch (e) {
        console.error('[AlertController.getAlerts]', e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
};

export const getAlertSummary = async (req, res) => {
    try {
        const summary = await AlertService.getAlertSummary();

        const totals = {
            critical: 0,
            warning: 0,
            info: 0,
            total: 0,
        };
        for (const row of summary) {
            const n = parseInt(row.count, 10);
            totals[row.severity] = (totals[row.severity] || 0) + n;
            totals.total += n;
        }

        return res.json({ success: true, totals, breakdown: summary });
    } catch (e) {
        console.error('[AlertController.getAlertSummary]', e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
};

export const getThresholds = async (req, res) => {
    return res.json({ success: true, thresholds: AlertService.THRESHOLDS });
};

export const acknowledgeAlert = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id ?? null;

    try {
        const alert = await AlertService.acknowledgeAlert(parseInt(id, 10), userId);
        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found or already acknowledged.',
            });
        }
        return res.json({ success: true, alert });
    } catch (e) {
        console.error('[AlertController.acknowledgeAlert]', e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
};

export const resolveAlert = async (req, res) => {
    const { id } = req.params;

    try {
        const alert = await AlertService.resolveAlert(parseInt(id, 10));
        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found or already resolved.',
            });
        }
        return res.json({ success: true, alert });
    } catch (e) {
        console.error('[AlertController.resolveAlert]', e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
};

export const triggerOdometerScan = async (req, res) => {
    try {
        const result = await AlertService.runOdometerAlerts();
        return res.json({ success: true, ...result });
    } catch (e) {
        console.error('[AlertController.triggerOdometerScan]', e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
};

export const triggerPredictiveScan = async (req, res) => {
    try {
        const result = await AlertService.runPredictiveReminders();
        return res.json({ success: true, ...result });
    } catch (e) {
        console.error('[AlertController.triggerPredictiveScan]', e.message);
        return res.status(500).json({ success: false, error: e.message });
    }
};
