import { validateTripAssignment } from './middleware/tripValidator.js';
import { createTrip, completeTrip } from './controllers/tripController.js';

router.post('/trips', validateTripAssignment, createTrip);
router.post('/trips/complete', completeTrip);