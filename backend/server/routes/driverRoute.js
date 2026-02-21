import express from 'express';
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  patchDriverStatus,
  deleteDriver,
} from '../controllers/driverController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/',
  authorizeRoles('manager', 'dispatcher', 'safety_officer', 'analyst'),
  getAllDrivers
);

router.get('/:id',
  authorizeRoles('manager', 'dispatcher', 'safety_officer', 'analyst'),
  getDriverById
);

router.post('/',
  authorizeRoles('manager', 'safety_officer'),
  createDriver
);

router.put('/:id',
  authorizeRoles('manager', 'safety_officer'),
  updateDriver
);

router.patch('/:id/status',
  authorizeRoles('manager', 'safety_officer'),
  patchDriverStatus
);

router.delete('/:id',
  authorizeRoles('manager'),
  deleteDriver
);

export default router;