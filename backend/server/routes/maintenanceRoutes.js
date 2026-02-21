import { addServiceLog } from '../controllers/maintenanceController.js'
import express from 'express'
const router = express.Router();
router.post('/maintenance', addServiceLog);

export default router;