import express from 'express';
import { validateTripAssignment } from '../middleware/tripValidator.js';
import { createTrip, completeTrip, cancelTrip } from '../controllers/tripController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// All trip routes require authentication
router.use(authenticate);

// Dispatcher and manager can create trips
router.post('/trips',
    authorizeRoles('manager', 'dispatcher'),
    validateTripAssignment,
    createTrip
);

// Complete a trip
router.post('/trips/complete',
    authorizeRoles('manager', 'dispatcher'),
    completeTrip
);

// Cancel a trip
router.post('/trips/cancel',
    authorizeRoles('manager', 'dispatcher'),
    cancelTrip
);

export default router;