import express from 'express';
import { getDashboard, getVehicleAnalytics, getMonthlyFinancialReport, getFinancialReport } from '../controllers/analyticalController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/dashboard',
    authorizeRoles('manager', 'analyst', 'safety_officer'),
    getDashboard
);

router.get('/vehicle/:id',
    authorizeRoles('manager', 'analyst', 'safety_officer', 'dispatcher'),
    getVehicleAnalytics
);

router.get('/financial/monthly',
    authorizeRoles('manager', 'analyst'),
    getMonthlyFinancialReport
);

router.get('/report',
    authorizeRoles('manager', 'analyst'),
    getFinancialReport
);

export default router;
