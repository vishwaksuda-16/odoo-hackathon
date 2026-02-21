import express from 'express';
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver
} from '../controllers/driverController.js';

const router = express.Router();

router.post('/', createDriver);
router.get('/', getAllDrivers);
router.get('/:id', getDriverById);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);

export default router;