import express from 'express';
import { addServiceLog, getMaintenanceLogs } from '../controllers/maintenanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.get('/',
    authenticate,
    authorizeRoles('manager', 'safety_officer', 'analyst', 'dispatcher'),
    getMaintenanceLogs
);

router.post('/',
    authenticate,
    authorizeRoles('manager', 'safety_officer'),
    addServiceLog
);

export default router;