import express from 'express';
import { validateTripAssignment } from '../middleware/tripValidator.js';
import { createTrip, completeTrip, cancelTrip } from '../controllers/tripController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/trips',
    authorizeRoles('manager', 'dispatcher'),
    validateTripAssignment,
    createTrip
);

router.post('/trips/complete',
    authorizeRoles('manager', 'dispatcher'),
    completeTrip
);

router.post('/trips/cancel',
    authorizeRoles('manager', 'dispatcher'),
    cancelTrip
);

export default router;