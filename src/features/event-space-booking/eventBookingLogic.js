export const isValidClockTime = value =>
  typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const toMinutes = value => {
  if (!isValidClockTime(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const overlaps = (start, end, otherStart, otherEnd) =>
  start < otherEnd && otherStart < end;

export const blocksAvailability = booking =>
  ['pending', 'approved'].includes(String(booking?.status || '').toLowerCase());

export const isValidDateOnly = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const isOnOrAfterLocalDate = (value, today = new Date()) => {
  if (!isValidDateOnly(value) || !(today instanceof Date) || Number.isNaN(today.getTime())) return false;
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return value >= localToday;
};

export const getRequestForToken = (request, token) =>
  request?.token === token ? request : null;

export const getMongoBookingId = booking => {
  const candidate = [booking?._id, booking?.bookingId, booking?.id].find(
    value => value !== undefined && value !== null && String(value).trim(),
  );
  return candidate === undefined ? '' : String(candidate);
};

export const isWithinVenueHours = (start, end, openingTime, closingTime) => {
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  const openingMinutes = toMinutes(openingTime);
  const closingMinutes = toMinutes(closingTime);

  return (
    startMinutes !== null &&
    endMinutes !== null &&
    openingMinutes !== null &&
    closingMinutes !== null &&
    endMinutes > startMinutes &&
    startMinutes >= openingMinutes &&
    endMinutes <= closingMinutes
  );
};

export const isValidGuestCount = (guests, capacity) =>
  Number.isInteger(Number(guests)) &&
  Number(guests) > 0 &&
  Number.isInteger(Number(capacity)) &&
  Number(capacity) > 0 &&
  Number(guests) <= Number(capacity);
