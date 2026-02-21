import express from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { register, login } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();


router.post('/register', register);
router.post('/login', login);

router.use(authenticate);

router.post('/', authorizeRoles('manager'), createVehicle);

router.get('/', authorizeRoles('manager', 'dispatcher', 'analyst', 'safety_officer'), getAllVehicles);

router.get('/:id', authorizeRoles('manager', 'dispatcher', 'analyst', 'safety_officer'), getVehicleById);

router.put('/:id', authorizeRoles('manager'), updateVehicle);

router.delete('/:id', authorizeRoles('manager'), deleteVehicle);

export default router;