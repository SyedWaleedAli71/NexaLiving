import assert from 'node:assert/strict';
import {afterEach, test} from 'node:test';
import type {Request, Response} from 'express';
import {Types} from 'mongoose';
import EventBooking from './models/EventBooking';
import EventVenue from './models/EventVenue';
import {
  availabilityBookingFilter,
  bookingConflictFilter,
  isConfiguredEventAdmin,
  isValidDateOnly,
  isValidGuestCount,
  isValidRejectionReason,
  isValidVenueDetails,
  isWithinVenueHours,
  residentBookingFilter,
} from './eventBookingLogic';
import {
  createBooking,
  getAdminAccess,
  listAdminBookings,
  reviewBooking,
} from './controllers/event.controller';

const originalAdminEmails = process.env.EVENT_ADMIN_EMAILS;
const originalSocietyId = process.env.EVENT_DEFAULT_SOCIETY_ID;
const objectId = '507f1f77bcf86cd799439011';

afterEach(() => {
  if (originalAdminEmails === undefined) delete process.env.EVENT_ADMIN_EMAILS;
  else process.env.EVENT_ADMIN_EMAILS = originalAdminEmails;

  if (originalSocietyId === undefined) delete process.env.EVENT_DEFAULT_SOCIETY_ID;
  else process.env.EVENT_DEFAULT_SOCIETY_ID = originalSocietyId;
});

function responseHarness() {
  let statusCode = 200;
  let body: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as unknown as Response;
  return {response, get statusCode() { return statusCode; }, get body() { return body; }};
}

function request(user?: { _id: string; email: string }, params: Record<string, string> = {}, body = {}) {
  return {user, params, body} as unknown as Request;
}

function stubSocietyLookup() {
  const connection = EventVenue.db;
  const originalCollection = connection.collection;
  (connection as unknown as {collection: (name: string) => unknown}).collection = ((name: string) => {
    if (name === 'societies') return {findOne: async () => ({_id: new Types.ObjectId(objectId), isActive: true})};
    return originalCollection.call(connection, name);
  }) as typeof connection.collection;
  return () => { connection.collection = originalCollection; };
}

function stubModelMethod(target: Record<string, unknown>, method: string, replacement: unknown) {
  const original = target[method];
  target[method] = replacement;
  return () => { target[method] = original; };
}

test('date and venue-hour validation rejects invalid calendar values and ranges', () => {
  assert.equal(isValidDateOnly('2026-11-05'), true);
  assert.equal(isValidDateOnly('2026-02-30'), false);
  assert.equal(isValidDateOnly('2026/11/05'), false);

  assert.equal(isWithinVenueHours('09:00', '10:00', '09:00', '22:00'), true);
  assert.equal(isWithinVenueHours('08:59', '10:00', '09:00', '22:00'), false);
  assert.equal(isWithinVenueHours('21:00', '22:01', '09:00', '22:00'), false);
  assert.equal(isWithinVenueHours('10:00', '10:00', '09:00', '22:00'), false);
});

test('guest counts must be whole numbers within venue capacity', () => {
  assert.equal(isValidGuestCount(50, 50), true);
  assert.equal(isValidGuestCount(51, 50), false);
  assert.equal(isValidGuestCount(1.5, 50), false);
  assert.equal(isValidGuestCount(1, 0), false);
});

test('venue validation checks capacity, rate, and opening/closing fields', () => {
  const venue = {
    name: 'Community Hall', description: '', location: 'Block A', capacity: 100,
    hourlyRate: 5000, currency: 'PKR', images: [], amenities: ['Parking'],
    openingTime: '09:00', closingTime: '22:00',
  };
  assert.equal(isValidVenueDetails(venue), true);
  assert.equal(isValidVenueDetails({...venue, capacity: 0}), false);
  assert.equal(isValidVenueDetails({...venue, hourlyRate: -1}), false);
  assert.equal(isValidVenueDetails({...venue, openingTime: '22:00', closingTime: '09:00'}), false);
});

test('availability and conflict filters include only pending and approved overlaps', () => {
  const venueId = new Types.ObjectId(objectId);
  const societyId = new Types.ObjectId('507f1f77bcf86cd799439012');
  const availability = availabilityBookingFilter(venueId, societyId, '2026-11-05');
  assert.deepEqual(availability.status, {$in: ['pending', 'approved']});

  const conflict = bookingConflictFilter(venueId, societyId, '2026-11-05', '10:00', '11:00');
  assert.deepEqual(conflict.status, {$in: ['pending', 'approved']});
  assert.deepEqual(conflict.start, {$lt: '11:00'});
  assert.deepEqual(conflict.end, {$gt: '10:00'});
  assert.equal('rejected' in conflict.status.$in, false);
  assert.equal('cancelled' in conflict.status.$in, false);

  const adjacent = bookingConflictFilter(venueId, societyId, '2026-11-05', '11:00', '12:00');
  assert.deepEqual(adjacent.start, {$lt: '12:00'});
  assert.deepEqual(adjacent.end, {$gt: '11:00'});
});

test('resident history filter is scoped to the authenticated user and society', () => {
  const residentId = new Types.ObjectId(objectId);
  const societyId = new Types.ObjectId('507f1f77bcf86cd799439012');
  const filter = residentBookingFilter(residentId, societyId);
  assert.equal(filter.residentId.toString(), objectId);
  assert.equal(filter.societyId.toString(), societyId.toString());
});

test('booking creation blocks an overlapping pending request before saving', async () => {
  process.env.EVENT_DEFAULT_SOCIETY_ID = objectId;
  const restoreSociety = stubSocietyLookup();
  const venueId = new Types.ObjectId('507f1f77bcf86cd799439012');
  let createCalled = false;
  const restoreLock = stubModelMethod(EventVenue as unknown as Record<string, unknown>, 'findOneAndUpdate', async () => ({
    _id: venueId, capacity: 60, openingTime: '09:00', closingTime: '22:00', isActive: true,
  }));
  const restoreRelease = stubModelMethod(EventVenue as unknown as Record<string, unknown>, 'updateOne', async () => ({modifiedCount: 1}));
  const restoreConflict = stubModelMethod(EventBooking as unknown as Record<string, unknown>, 'findOne', async () => ({_id: new Types.ObjectId(), status: 'pending'}));
  const restoreCreate = stubModelMethod(EventBooking as unknown as Record<string, unknown>, 'create', async () => { createCalled = true; return {}; });

  try {
    const res = responseHarness();
    await createBooking(
      request({_id: objectId, email: 'resident@example.com'}, {}, {
        venueId: venueId.toString(), date: '2099-01-01', start: '10:00', end: '11:00',
        guests: 20, purpose: 'Team meeting', notes: '',
      }),
      res.response,
      () => {},
    );
    assert.equal(res.statusCode, 409);
    assert.equal(createCalled, false);
  } finally {
    restoreCreate(); restoreConflict(); restoreRelease(); restoreLock(); restoreSociety();
  }
});

test('booking creation uses the authenticated resident and returns MongoDB identity separately', async () => {
  process.env.EVENT_DEFAULT_SOCIETY_ID = objectId;
  const restoreSociety = stubSocietyLookup();
  const venueId = new Types.ObjectId('507f1f77bcf86cd799439012');
  const bookingId = new Types.ObjectId('507f1f77bcf86cd799439013');
  let savedData: Record<string, unknown> | null = null;
  const restoreLock = stubModelMethod(EventVenue as unknown as Record<string, unknown>, 'findOneAndUpdate', async () => ({
    _id: venueId, capacity: 60, openingTime: '09:00', closingTime: '22:00', isActive: true,
  }));
  const restoreRelease = stubModelMethod(EventVenue as unknown as Record<string, unknown>, 'updateOne', async () => ({modifiedCount: 1}));
  const restoreConflict = stubModelMethod(EventBooking as unknown as Record<string, unknown>, 'findOne', async () => null);
  const restoreCreate = stubModelMethod(EventBooking as unknown as Record<string, unknown>, 'create', async (data: Record<string, unknown>) => {
    savedData = {...data, _id: bookingId, bookingCode: 'NXL-TEST-CODE'};
    return savedData;
  });

  try {
    const res = responseHarness();
    await createBooking(
      request({_id: objectId, email: 'resident@example.com'}, {}, {
        venueId: venueId.toString(), date: '2099-01-01', start: '10:00', end: '11:00',
        guests: 20, purpose: 'Team meeting', notes: '', residentId: 'spoofed-user-id',
      }),
      res.response,
      () => {},
    );
    const saved = (res.body as {booking: {_id: Types.ObjectId; bookingCode: string; residentId: Types.ObjectId}}).booking;
    assert.equal(res.statusCode, 201);
    assert.equal(saved._id.toString(), bookingId.toString());
    assert.equal(saved.bookingCode, 'NXL-TEST-CODE');
    assert.equal(saved.residentId.toString(), objectId);
    assert.equal((savedData as unknown as {residentId: Types.ObjectId}).residentId.toString(), objectId);
  } finally {
    restoreCreate(); restoreConflict(); restoreRelease(); restoreLock(); restoreSociety();
  }
});

test('admin authorization compares configured emails without returning the list', () => {
  assert.equal(isConfiguredEventAdmin(' ADMIN@example.com ', 'admin@example.com,other@example.com'), true);
  assert.equal(isConfiguredEventAdmin('resident@example.com', 'admin@example.com'), false);

  process.env.EVENT_ADMIN_EMAILS = 'admin@example.com';
  const res = responseHarness();
  getAdminAccess(request({_id: objectId, email: 'ADMIN@example.com'}), res.response);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {isAdmin: true});
});

test('missing and unauthorized Admin access is denied', () => {
  process.env.EVENT_ADMIN_EMAILS = 'admin@example.com';

  const anonymous = responseHarness();
  getAdminAccess(request(), anonymous.response);
  assert.equal(anonymous.statusCode, 401);

  const resident = responseHarness();
  getAdminAccess(request({_id: objectId, email: 'resident@example.com'}), resident.response);
  assert.equal(resident.statusCode, 403);
});

test('Admin booking list and approve/reject routes reject unauthorized users', async () => {
  process.env.EVENT_ADMIN_EMAILS = 'admin@example.com';
  process.env.EVENT_DEFAULT_SOCIETY_ID = objectId;

  const bookings = responseHarness();
  await listAdminBookings(request({_id: objectId, email: 'resident@example.com'}), bookings.response, () => {});
  assert.equal(bookings.statusCode, 403);

  for (const action of ['approve', 'reject']) {
    const review = responseHarness();
    await reviewBooking(
      request({_id: objectId, email: 'resident@example.com'}, {bookingId: objectId, action}, {reason: 'Test'}),
      review.response,
      () => {},
    );
    assert.equal(review.statusCode, 403);
  }
});

test('reject requires a non-empty reason no longer than 500 characters', async () => {
  process.env.EVENT_ADMIN_EMAILS = 'admin@example.com';
  process.env.EVENT_DEFAULT_SOCIETY_ID = objectId;

  assert.equal(isValidRejectionReason('  Scheduling conflict  '), true);
  assert.equal(isValidRejectionReason('   '), false);
  assert.equal(isValidRejectionReason('x'.repeat(501)), false);

  const missingReason = responseHarness();
  await reviewBooking(
    request({_id: objectId, email: 'admin@example.com'}, {bookingId: objectId, action: 'reject'}, {}),
    missingReason.response,
    () => {},
  );
  assert.equal(missingReason.statusCode, 422);
});

test('booking review requires a MongoDB ObjectId and never treats bookingCode as an id', async () => {
  process.env.EVENT_ADMIN_EMAILS = 'admin@example.com';
  process.env.EVENT_DEFAULT_SOCIETY_ID = objectId;

  const invalidId = responseHarness();
  await reviewBooking(
    request({_id: objectId, email: 'admin@example.com'}, {bookingId: 'NXL-BOOKING-CODE', action: 'approve'}),
    invalidId.response,
    () => {},
  );
  assert.equal(invalidId.statusCode, 422);
});
