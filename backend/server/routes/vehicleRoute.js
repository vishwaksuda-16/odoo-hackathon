import express from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  retireVehicle,
  softDeleteVehicle,
} from '../controllers/vehicleController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/',
  authorizeRoles('manager', 'dispatcher', 'analyst', 'safety_officer'),
  getAllVehicles
);

router.get('/:id',
  authorizeRoles('manager', 'dispatcher', 'analyst', 'safety_officer'),
  getVehicleById
);

router.post('/create',
  authorizeRoles('manager'),
  createVehicle
);

router.put('/:id',
  authorizeRoles('manager'),
  updateVehicle
);

router.patch('/:id/retire',
  authorizeRoles('manager'),
  retireVehicle
);

router.delete('/:id',
  authorizeRoles('manager'),
  softDeleteVehicle
);

export default router;