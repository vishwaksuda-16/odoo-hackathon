import express from 'express';
import { addServiceLog } from '../controllers/maintenanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.post('/maintenance',
    authenticate,
    authorizeRoles('manager', 'safety_officer'),
    addServiceLog
);

export default router;