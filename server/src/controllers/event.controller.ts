import {Request, Response, NextFunction} from 'express';
import {randomBytes} from 'crypto';
import {Types} from 'mongoose';

import EventVenue from '../models/EventVenue';
import EventBooking from '../models/EventBooking';
import {
  availabilityBookingFilter,
  bookingConflictFilter,
  isConfiguredEventAdmin,
  isValidDateOnly,
  isValidGuestCount,
  isValidRejectionReason,
  isValidTime,
  isValidVenueDetails,
  isWithinVenueHours,
  residentBookingFilter,
} from '../eventBookingLogic';

function getUser(req: Request) {
  if (!req.user) return null;

  return {
    id: String(req.user._id),
    email: req.user.email.toLowerCase(),
  };
}

function isAdmin(req: Request): boolean {
  const user = getUser(req);

  return Boolean(user && isConfiguredEventAdmin(user.email));
}

function getSocietyId(): Types.ObjectId | null {
  const value = process.env.EVENT_DEFAULT_SOCIETY_ID || '';

  if (!Types.ObjectId.isValid(value)) return null;

  return new Types.ObjectId(value);
}

async function getActiveEventSocietyId(): Promise<Types.ObjectId | null> {
  const societyId = getSocietyId();
  if (!societyId) return null;

  const society = await EventVenue.db.collection('societies').findOne(
    {_id: societyId, isActive: true},
    {projection: {_id: 1}},
  );
  return society ? societyId : null;
}

function getToday(): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: process.env.EVENT_TIME_ZONE || 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(value => value.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isResident(req: Request): boolean {
  // The existing application only creates verified resident accounts and its
  // User model has no separate role field. Keep the verified-user middleware
  // as the source of resident identity while Admin access remains additive.
  return Boolean(getUser(req));
}

function sendError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  const status = (error as {status?: number})?.status;

  if (status) {
    res.status(status).json({
      message: (error as Error).message,
    });
    return;
  }

  next(error);
}

function createError(message: string, status: number) {
  return Object.assign(new Error(message), {status});
}

async function acquireVenueLock(venueId: string | Types.ObjectId, societyId: Types.ObjectId) {
  const lockToken = randomBytes(16).toString('hex');
  const now = new Date();
  const venue = await EventVenue.findOneAndUpdate(
    {
      _id: venueId,
      societyId,
      isActive: true,
      $or: [
        {bookingLockToken: null},
        {bookingLockExpiresAt: {$lte: now}},
      ],
    },
    {
      $set: {
        bookingLockToken: lockToken,
        bookingLockExpiresAt: new Date(now.getTime() + 5 * 60 * 1000),
      },
    },
    {new: true},
  );

  return venue ? {venue, lockToken} : null;
}

async function releaseVenueLock(
  venueId: string | Types.ObjectId,
  societyId: Types.ObjectId,
  lockToken: string,
): Promise<void> {
  await EventVenue.updateOne(
    {_id: venueId, societyId, bookingLockToken: lockToken},
    {$unset: {bookingLockToken: 1, bookingLockExpiresAt: 1}},
  );
}

export function getAdminAccess(req: Request, res: Response): void {
  if (!getUser(req)) {
    res.status(401).json({message: 'Authentication required.'});
    return;
  }

  if (!isAdmin(req)) {
    res.status(403).json({message: 'Admin access required.'});
    return;
  }

  res.json({isAdmin: true});
}

/**
 * GET /api/events/venues
 * List active venues in the configured society.
 */
export async function listVenues(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!getUser(req)) {
      res.status(401).json({message: 'Authentication required.'});
      return;
    }

    const societyId = await getActiveEventSocietyId();

    if (!societyId) {
      res.status(503).json({
        message: 'Event society configuration is missing or invalid.',
      });
      return;
    }

    const venues = await EventVenue.find({
      societyId,
      isActive: true,
    }).sort({name: 1}).lean();

    res.json({
      venues: venues.map(venue => ({
        ...venue,
        id: String(venue._id),
        image: venue.images?.[0] || '',
        facilities: venue.amenities || [],
        hours: `${venue.openingTime} – ${venue.closingTime}`,
        price: `${venue.currency} ${venue.hourlyRate}/hour`,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/events/admin/venues
 * Create a venue. Only configured admins can do this.
 */
export async function createVenue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({message: 'Admin access required.'});
      return;
    }

    const societyId = await getActiveEventSocietyId();

    if (!societyId) {
      res.status(503).json({
        message: 'Event society configuration is missing or invalid.',
      });
      return;
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const {
      name,
      description = '',
      location,
      capacity,
      hourlyRate,
      currency = 'PKR',
      images = [],
      amenities = [],
      openingTime,
      closingTime,
    } = body;
    const venueDetails = {
      name: typeof name === 'string' ? name.trim() : name,
      description: typeof description === 'string' ? description.trim() : description,
      location: typeof location === 'string' ? location.trim() : location,
      capacity: Number(capacity),
      hourlyRate: Number(hourlyRate),
      currency: typeof currency === 'string' ? currency.trim().toUpperCase() : currency,
      images,
      amenities,
      openingTime,
      closingTime,
    };

    if (!isValidVenueDetails(venueDetails)) {
      res.status(422).json({
        message: 'Please provide valid venue details.',
      });
      return;
    }

    const venue = await EventVenue.create({
      societyId,
      ...venueDetails,
      openingTime,
      closingTime,
      isActive: true,
    });

    res.status(201).json({
      message: 'Venue created successfully.',
      venue,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

/**
 * GET /api/events/availability?venueId=...&date=YYYY-MM-DD
 */
export async function checkAvailability(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!getUser(req)) {
      res.status(401).json({message: 'Authentication required.'});
      return;
    }

    const venueId = typeof req.query.venueId === 'string' ? req.query.venueId : '';
    const date = typeof req.query.date === 'string' ? req.query.date : '';

    const societyId = await getActiveEventSocietyId();

    if (!societyId) {
      res.status(503).json({message: 'Event society is not configured.'});
      return;
    }

    if (
      !venueId ||
      !Types.ObjectId.isValid(venueId) ||
      !date ||
      !isValidDateOnly(date)
    ) {
      res.status(422).json({
        message: 'Valid venueId and date are required.',
      });
      return;
    }

    const venue = await EventVenue.findOne({
      _id: venueId,
      societyId,
      isActive: true,
    });

    if (!venue) {
      res.status(404).json({message: 'Venue not found.'});
      return;
    }

    const bookings = await EventBooking.find(
      availabilityBookingFilter(new Types.ObjectId(venueId), societyId, date),
    )
      .select('start end status')
      .sort({start: 1})
      .lean();

    res.json({
      venueId,
      date,
      openingTime: venue.openingTime,
      closingTime: venue.closingTime,
      blockedSlots: bookings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/events/bookings
 * Save a resident booking request.
 */
export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = getUser(req);

  if (!user) {
    res.status(401).json({message: 'Authentication required.'});
    return;
  }

  if (!isResident(req)) {
    res.status(403).json({message: 'Resident access required.'});
    return;
  }

  const societyId = await getActiveEventSocietyId();

  if (!societyId) {
    res.status(503).json({message: 'Event society is not configured.'});
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const {
    venueId,
    date,
    start,
    end,
    guests,
    purpose,
    notes = '',
  } = body;

  if (
    typeof venueId !== 'string' ||
    !Types.ObjectId.isValid(venueId) ||
    !isValidDateOnly(date) ||
    date < getToday() ||
    !isValidTime(start) ||
    !isValidTime(end) ||
    end <= start ||
    !Number.isInteger(Number(guests)) ||
    Number(guests) < 1 ||
    typeof purpose !== 'string' ||
    !purpose.trim() ||
    purpose.trim().length > 300 ||
    typeof notes !== 'string' ||
    notes.length > 1000
  ) {
    res.status(422).json({
      message: 'Please provide valid booking details.',
    });
    return;
  }

  try {
    const lock = await acquireVenueLock(venueId, societyId);
    if (!lock) {
      const venueExists = await EventVenue.exists({
        _id: venueId,
        societyId,
        isActive: true,
      });
      if (!venueExists) {
        throw createError('Venue not found or unavailable.', 404);
      }

      throw createError('This venue is processing another booking. Please retry.', 409);
    }

    const {venue, lockToken} = lock;
    let savedBooking;
    try {

      if (!isValidGuestCount(guests, venue.capacity)) {
        throw createError(
          `Maximum venue capacity is ${venue.capacity}.`,
          422,
        );
      }

      if (!isWithinVenueHours(start, end, venue.openingTime, venue.closingTime)) {
        throw createError(
          'Selected time is outside venue opening hours.',
          422,
        );
      }

      const conflict = await EventBooking.findOne(
        bookingConflictFilter(venue._id, societyId, date, start, end),
      );

      if (conflict) {
        throw createError(
          'This time overlaps an existing booking request.',
          409,
        );
      }

      savedBooking = await EventBooking.create({
        societyId,
        venueId: venue._id,
        residentId: new Types.ObjectId(user.id),
        date,
        start,
        end,
        guests: Number(guests),
        purpose: purpose.trim(),
        notes: notes.trim(),
        status: 'pending',
      });
    } finally {
      try {
        await releaseVenueLock(venue._id, societyId, lockToken);
      } catch {
        // The five-minute lease provides recovery if the database is briefly unavailable.
      }
    }

    res.status(201).json({
      message: 'Booking request submitted successfully.',
      booking: savedBooking,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

/**
 * GET /api/events/bookings/my
 * Only return bookings belonging to the logged-in resident.
 */
export async function listMyBookings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = getUser(req);

  if (!user) {
    res.status(401).json({message: 'Authentication required.'});
    return;
  }

  if (!isResident(req)) {
    res.status(403).json({message: 'Resident access required.'});
    return;
  }

  try {
    const societyId = await getActiveEventSocietyId();

    if (!societyId) {
      res.status(503).json({message: 'Event society is not configured.'});
      return;
    }

    const bookings = await EventBooking.find(
      residentBookingFilter(new Types.ObjectId(user.id), societyId),
    )
      .populate('venueId', 'name images location')
      .sort({createdAt: -1})
      .lean();

    res.json({bookings});
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/admin/bookings
 * Admin-only booking queue.
 */
export async function listAdminBookings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!isAdmin(req)) {
    res.status(403).json({message: 'Admin access required.'});
    return;
  }

  try {
    const societyId = await getActiveEventSocietyId();

    if (!societyId) {
      res.status(503).json({message: 'Event society is not configured.'});
      return;
    }

    if (req.query.status !== undefined && typeof req.query.status !== 'string') {
      res.status(422).json({message: 'Unsupported booking status filter.'});
      return;
    }
    const status = typeof req.query.status === 'string'
      ? req.query.status.toLowerCase()
      : '';

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      res.status(422).json({message: 'Unsupported booking status filter.'});
      return;
    }

    const filter: Record<string, unknown> = {societyId};

    if (status) {
      filter.status = status;
    }

    const bookings = await EventBooking.find(filter)
      .populate('venueId', 'name location images')
      .populate('residentId', 'fullName email')
      .sort({createdAt: -1})
      .lean();

    res.json({bookings});
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/events/admin/bookings/:bookingId/approve
 * PATCH /api/events/admin/bookings/:bookingId/reject
 */
export async function reviewBooking(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = getUser(req);

  if (!user || !isAdmin(req)) {
    res.status(403).json({message: 'Admin access required.'});
    return;
  }

  const bookingIdParam = req.params.bookingId;
  const bookingId = Array.isArray(bookingIdParam)
    ? bookingIdParam[0]
    : bookingIdParam;
  const actionParam = req.params.action;
  const action = (
    Array.isArray(actionParam) ? actionParam[0] : actionParam || ''
  ).toLowerCase();
  if (
    !Types.ObjectId.isValid(bookingId) ||
    !['approve', 'reject'].includes(action)
  ) {
    res.status(422).json({message: 'Invalid booking review request.'});
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const rejectionReason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (action === 'reject' && !isValidRejectionReason(rejectionReason)) {
    res.status(422).json({message: 'A rejection reason of 1 to 500 characters is required.'});
    return;
  }

  try {
    const societyId = await getActiveEventSocietyId();
    if (!societyId) {
      res.status(503).json({message: 'Event society is not configured.'});
      return;
    }

    const initialBooking = await EventBooking.findOne({
      _id: bookingId,
      societyId,
    });

    if (!initialBooking) {
      throw createError('Booking not found.', 404);
    }

    if (initialBooking.status !== 'pending') {
      throw createError('Only pending bookings can be reviewed.', 409);
    }

    const venueId = String(initialBooking.venueId);
    const lock = await acquireVenueLock(venueId, societyId);
    if (!lock) {
      throw createError('Venue is unavailable or processing another booking.', 409);
    }

    const {venue, lockToken} = lock;
    let updatedBooking;
    try {
      const booking = await EventBooking.findOne({
        _id: bookingId,
        societyId,
      });

      if (!booking) {
        throw createError('Booking not found.', 404);
      }

      if (booking.status !== 'pending') {
        throw createError(
          'Only pending bookings can be reviewed.',
          409,
        );
      }

      if (!venue.isActive || String(booking.venueId) !== String(venue._id)) {
        throw createError('Venue is no longer available.', 409);
      }

      if (action === 'approve') {
        const conflict = await EventBooking.findOne(
          bookingConflictFilter(
            booking.venueId,
            societyId,
            booking.date,
            booking.start,
            booking.end,
            booking._id,
          ),
        );

        if (conflict) {
          throw createError(
            'Another booking overlaps this time. Resolve that request first.',
            409,
          );
        }

        booking.status = 'approved';
        booking.rejectionReason = null;
      } else {
        booking.status = 'rejected';
        booking.rejectionReason = rejectionReason;
      }

      booking.reviewedBy = new Types.ObjectId(user.id);
      booking.reviewedAt = new Date();

      await booking.save();

      updatedBooking = booking;
    } finally {
      try {
        await releaseVenueLock(venue._id, societyId, lockToken);
      } catch {
        // The five-minute lease provides recovery if the database is briefly unavailable.
      }
    }

    res.json({
      message:
        action === 'approve'
          ? 'Booking approved successfully.'
          : 'Booking rejected successfully.',
      booking: updatedBooking,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function updateVenue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({message: 'Admin access required.'});
      return;
    }

    const societyId = await getActiveEventSocietyId();
    if (!societyId) {
      res.status(503).json({message: 'Event society is not configured.'});
      return;
    }

    const venueId = Array.isArray(req.params.venueId)
      ? req.params.venueId[0]
      : req.params.venueId;
    if (!Types.ObjectId.isValid(venueId)) {
      res.status(422).json({message: 'Invalid venue id.'});
      return;
    }

    const lock = await acquireVenueLock(venueId, societyId);
    if (!lock) {
      const venueExists = await EventVenue.findOne({_id: venueId, societyId});
      if (!venueExists) {
        res.status(404).json({message: 'Venue not found.'});
        return;
      }

      if (!venueExists.isActive) {
        res.status(409).json({message: 'Only active venues can be edited.'});
        return;
      }

      res.status(409).json({message: 'Venue is processing a booking. Please retry.'});
      return;
    }

    const {venue, lockToken} = lock;
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const allowed = [
        'name', 'description', 'location', 'capacity', 'hourlyRate',
        'currency', 'images', 'amenities', 'openingTime', 'closingTime',
      ] as const;
      const update: Record<string, unknown> = {};
      for (const key of allowed) {
        if (body[key] !== undefined) update[key] = body[key];
      }
      if (!Object.keys(update).length) {
        res.status(422).json({message: 'Provide at least one venue field to update.'});
        return;
      }

      const candidate: Record<string, unknown> = {
        name: venue.name,
        description: venue.description,
        location: venue.location,
        capacity: venue.capacity,
        hourlyRate: venue.hourlyRate,
        currency: venue.currency,
        images: venue.images,
        amenities: venue.amenities,
        openingTime: venue.openingTime,
        closingTime: venue.closingTime,
        ...update,
      };
      if (typeof candidate.name === 'string') candidate.name = candidate.name.trim();
      if (typeof candidate.description === 'string') candidate.description = candidate.description.trim();
      if (typeof candidate.location === 'string') candidate.location = candidate.location.trim();
      if (candidate.capacity !== undefined) candidate.capacity = Number(candidate.capacity);
      if (candidate.hourlyRate !== undefined) candidate.hourlyRate = Number(candidate.hourlyRate);
      if (typeof candidate.currency === 'string') candidate.currency = candidate.currency.trim().toUpperCase();

      if (!isValidVenueDetails(candidate)) {
        res.status(422).json({message: 'Please provide valid venue details, capacity, rate, and opening/closing hours.'});
        return;
      }

      venue.set(candidate);
      await venue.save();
      res.json({message: 'Venue updated successfully.', venue});
    } finally {
      try {
        await releaseVenueLock(venue._id, societyId, lockToken);
      } catch {
        // The five-minute lease provides recovery if the database is briefly unavailable.
      }
    }
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function deactivateVenue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({message: 'Admin access required.'});
      return;
    }

    const societyId = await getActiveEventSocietyId();
    if (!societyId) {
      res.status(503).json({message: 'Event society is not configured.'});
      return;
    }

    const venueId = Array.isArray(req.params.venueId)
      ? req.params.venueId[0]
      : req.params.venueId;
    if (!Types.ObjectId.isValid(venueId)) {
      res.status(422).json({message: 'Invalid venue id.'});
      return;
    }

    const lock = await acquireVenueLock(venueId, societyId);
    if (!lock) {
      const venueExists = await EventVenue.findOne({_id: venueId, societyId});
      if (!venueExists) {
        res.status(404).json({message: 'Venue not found.'});
        return;
      }
      if (!venueExists.isActive) {
        res.json({message: 'Venue is already deactivated.', venue: venueExists});
        return;
      }

      res.status(409).json({message: 'Venue is processing a booking. Please retry.'});
      return;
    }

    const {venue, lockToken} = lock;
    try {
      venue.isActive = false;
      await venue.save();
    } finally {
      try {
        await releaseVenueLock(venue._id, societyId, lockToken);
      } catch {
        // The five-minute lease provides recovery if the database is briefly unavailable.
      }
    }

    res.json({message: 'Venue deactivated successfully.', venue});
  } catch (error) {
    sendError(error, res, next);
  }
}
