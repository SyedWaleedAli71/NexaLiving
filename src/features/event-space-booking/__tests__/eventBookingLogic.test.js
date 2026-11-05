import {
  blocksAvailability,
  getMongoBookingId,
  getRequestForToken,
  isOnOrAfterLocalDate,
  isValidDateOnly,
  isValidGuestCount,
  isWithinVenueHours,
  overlaps,
} from '../eventBookingLogic';
describe('Event Booking validation helpers', () => {
  test('prefers MongoDB _id, then bookingId, then id', () => {
    expect(getMongoBookingId({_id: 'mongo', bookingId: 'api', id: 'legacy'})).toBe('mongo');
    expect(getMongoBookingId({bookingId: 'api', id: 'legacy'})).toBe('api');
    expect(getMongoBookingId({_id: '', bookingId: 'api'})).toBe('api');
    expect(getMongoBookingId({id: 'legacy'})).toBe('legacy');
  });

  test('detects overlapping intervals while allowing adjacent slots', () => {
    expect(overlaps(600, 660, 630, 690)).toBe(true);
    expect(overlaps(600, 660, 660, 720)).toBe(false);
  });

  test('does not let rejected or cancelled bookings block availability', () => {
    expect(blocksAvailability({status: 'pending'})).toBe(true);
    expect(blocksAvailability({status: 'approved'})).toBe(true);
    expect(blocksAvailability({status: 'rejected'})).toBe(false);
    expect(blocksAvailability({status: 'cancelled'})).toBe(false);
    expect(blocksAvailability({status: 'unknown'})).toBe(false);
  });

  test('accepts only real YYYY-MM-DD calendar dates and rejects past dates', () => {
    expect(isValidDateOnly('2026-02-28')).toBe(true);
    expect(isValidDateOnly('2026-02-30')).toBe(false);
    expect(isValidDateOnly('2026-2-03')).toBe(false);
    const today = new Date(2026, 1, 12, 8, 0, 0);
    expect(isOnOrAfterLocalDate('2026-02-12', today)).toBe(true);
    expect(isOnOrAfterLocalDate('2026-02-11', today)).toBe(false);
  });

  test('validates start/end ordering and venue opening and closing times', () => {
    expect(isWithinVenueHours('09:00', '10:00', '09:00', '22:00')).toBe(true);
    expect(isWithinVenueHours('08:59', '10:00', '09:00', '22:00')).toBe(false);
    expect(isWithinVenueHours('21:00', '22:01', '09:00', '22:00')).toBe(false);
    expect(isWithinVenueHours('10:00', '09:00', '09:00', '22:00')).toBe(false);
  });

  test('accepts whole guest counts up to capacity only', () => {
    expect(isValidGuestCount(5, 50)).toBe(true);
    expect(isValidGuestCount(51, 50)).toBe(false);
    expect(isValidGuestCount(1.5, 50)).toBe(false);
    expect(isValidGuestCount(1, 0)).toBe(false);
  });

  test('reuses an in-flight initial load only for the same authenticated user', () => {
    const request = {token: 'resident-token', promise: Promise.resolve()};
    expect(getRequestForToken(request, 'resident-token')).toBe(request);
    expect(getRequestForToken(request, 'another-resident')).toBeNull();
  });
});
