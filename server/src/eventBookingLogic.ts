import {Types} from 'mongoose';

export const EVENT_BLOCKING_STATUSES = ['pending', 'approved'] as const;

export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isValidTimeRange(start: unknown, end: unknown): boolean {
  return isValidTime(start) && isValidTime(end) && timeToMinutes(end) > timeToMinutes(start);
}

export function isWithinVenueHours(
  start: unknown,
  end: unknown,
  openingTime: unknown,
  closingTime: unknown,
): boolean {
  if (
    !isValidTime(start) ||
    !isValidTime(end) ||
    !isValidTime(openingTime) ||
    !isValidTime(closingTime)
  ) return false;

  return (
    timeToMinutes(end) > timeToMinutes(start) &&
    timeToMinutes(openingTime) < timeToMinutes(closingTime) &&
    timeToMinutes(start) >= timeToMinutes(openingTime) &&
    timeToMinutes(end) <= timeToMinutes(closingTime)
  );
}

export function isValidGuestCount(guests: unknown, capacity: unknown): boolean {
  const guestCount = Number(guests);
  const venueCapacity = Number(capacity);
  return (
    Number.isInteger(guestCount) &&
    guestCount > 0 &&
    Number.isInteger(venueCapacity) &&
    venueCapacity > 0 &&
    guestCount <= venueCapacity
  );
}

export function isValidVenueDetails(venue: Record<string, unknown>): boolean {
  const rateIsPresent =
    (typeof venue.hourlyRate === 'number' && Number.isFinite(venue.hourlyRate)) ||
    (typeof venue.hourlyRate === 'string' && venue.hourlyRate.trim().length > 0);

  return (
    typeof venue.name === 'string' &&
    venue.name.trim().length > 0 &&
    venue.name.trim().length <= 120 &&
    typeof venue.location === 'string' &&
    venue.location.trim().length > 0 &&
    venue.location.trim().length <= 200 &&
    typeof venue.description === 'string' &&
    venue.description.length <= 2000 &&
    isValidGuestCount(1, venue.capacity) &&
    rateIsPresent &&
    Number.isFinite(Number(venue.hourlyRate)) &&
    Number(venue.hourlyRate) >= 0 &&
    typeof venue.currency === 'string' &&
    /^[A-Z]{3}$/.test(venue.currency) &&
    isWithinVenueHours(venue.openingTime, venue.closingTime, venue.openingTime, venue.closingTime) &&
    Array.isArray(venue.images) &&
    venue.images.length <= 20 &&
    venue.images.every(value => typeof value === 'string' && value.length <= 2048) &&
    Array.isArray(venue.amenities) &&
    venue.amenities.length <= 50 &&
    venue.amenities.every(value => typeof value === 'string' && value.trim().length > 0 && value.length <= 100)
  );
}

export function getConfiguredAdminEmails(configured = process.env.EVENT_ADMIN_EMAILS || ''): string[] {
  return configured
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredEventAdmin(email: unknown, configured?: string): boolean {
  if (typeof email !== 'string' || !email.trim()) return false;
  return getConfiguredAdminEmails(configured).includes(email.trim().toLowerCase());
}

export function residentBookingFilter(residentId: Types.ObjectId, societyId: Types.ObjectId) {
  return {residentId, societyId};
}

export function availabilityBookingFilter(venueId: Types.ObjectId, societyId: Types.ObjectId, date: string) {
  return {
    venueId,
    societyId,
    date,
    status: {$in: [...EVENT_BLOCKING_STATUSES]},
  };
}

export function bookingConflictFilter(
  venueId: Types.ObjectId,
  societyId: Types.ObjectId,
  date: string,
  start: string,
  end: string,
  excludeBookingId?: Types.ObjectId,
) {
  return {
    ...(excludeBookingId ? {_id: {$ne: excludeBookingId}} : {}),
    venueId,
    societyId,
    date,
    status: {$in: [...EVENT_BLOCKING_STATUSES]},
    start: {$lt: end},
    end: {$gt: start},
  };
}

export function isValidRejectionReason(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 500;
}

export function overlaps(start: string, end: string, otherStart: string, otherEnd: string): boolean {
  return start < otherEnd && otherStart < end;
}
