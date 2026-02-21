import { validateTripAssignment } from '../middleware/tripValidator.js';
import { createTrip, completeTrip } from '../controllers/tripController.js';
import express from 'express';
const router  = express.Router();
router.post('/trips', validateTripAssignment, createTrip);
router.post('/trips/complete', completeTrip);

export default router;