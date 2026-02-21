import express from 'express';
import {
    downloadFinancialCSV,
    downloadPayrollCSV,
    downloadVehicleHealthCSV,
    downloadFinancialPDF,
} from '../controllers/exportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('manager', 'analyst'));

router.get('/financial/csv', downloadFinancialCSV);
router.get('/financial/pdf', downloadFinancialPDF);
router.get('/payroll/csv', downloadPayrollCSV);
router.get('/vehicle-health/csv', downloadVehicleHealthCSV);

export default router;
