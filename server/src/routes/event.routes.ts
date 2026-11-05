import {Router} from 'express';

import requireAuth from '../middleware/auth';
import * as eventController from '../controllers/event.controller';

const router = Router();

// Resident: venues aur availability
router.get(
  '/venues',
  requireAuth,
  eventController.listVenues,
);

router.get(
  '/availability',
  requireAuth,
  eventController.checkAvailability,
);

// Resident: booking create aur apni bookings dekhna
router.post(
  '/bookings',
  requireAuth,
  eventController.createBooking,
);

router.get(
  '/bookings/my',
  requireAuth,
  eventController.listMyBookings,
);

// Admin: venues manage karna
router.get('/admin/access', requireAuth, eventController.getAdminAccess);
router.post(
  '/admin/venues',
  requireAuth,
  eventController.createVenue,
);
router.patch('/admin/venues/:venueId', requireAuth, eventController.updateVenue);
router.patch('/admin/venues/:venueId/deactivate', requireAuth, eventController.deactivateVenue);

// Admin: booking requests dekhna
router.get(
  '/admin/bookings',
  requireAuth,
  eventController.listAdminBookings,
);

// Admin: approve / reject
router.patch(
  '/admin/bookings/:bookingId/approve',
  requireAuth,
  (req, res, next) => { req.params.action = 'approve'; eventController.reviewBooking(req, res, next); },
);
router.patch('/admin/bookings/:bookingId/reject', requireAuth, (req, res, next) => { req.params.action = 'reject'; eventController.reviewBooking(req, res, next); });

export default router;
