import express from 'express';
import {
    getAlerts,
    getAlertSummary,
    getThresholds,
    acknowledgeAlert,
    resolveAlert,
    triggerOdometerScan,
    triggerPredictiveScan,
} from '../controllers/alertController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getAlerts);
router.get('/summary', authenticate, getAlertSummary);
router.get('/thresholds', authenticate, getThresholds);

router.post('/:id/acknowledge',
    authenticate,
    authorizeRoles('manager', 'safety_officer', 'dispatcher'),
    acknowledgeAlert
);

router.post('/:id/resolve',
    authenticate,
    authorizeRoles('manager', 'safety_officer'),
    resolveAlert
);

router.post('/scan/odometer',
    authenticate,
    authorizeRoles('manager'),
    triggerOdometerScan
);

router.post('/scan/predictive',
    authenticate,
    authorizeRoles('manager'),
    triggerPredictiveScan
);

export default router;
