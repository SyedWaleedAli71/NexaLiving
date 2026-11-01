import {API_BASE_URL} from './authService';

const TIMEOUT_MS = 15000;

async function request(path, {method = 'GET', body, token} = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error = new Error(
        data.message || `Request failed (${response.status})`,
      );

      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Server request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeStatus(status) {
  const value = String(status || 'pending').toLowerCase();

  if (value === 'approved') return 'Approved';
  if (value === 'rejected') return 'Rejected';

  return 'Pending';
}

function normalizeVenue(venue) {
  return {
    id: String(venue.id || venue._id),
    name: venue.name || 'Unnamed Venue',
    short: venue.description || '',
    description: venue.description || '',
    location: venue.location || '',
    capacity: Number(venue.capacity || 0),
    facilities: venue.facilities || venue.amenities || [],
    image:
      venue.image ||
      venue.images?.[0] ||
      '',
    images: venue.images || (venue.image ? [venue.image] : []),
    amenities: venue.amenities || venue.facilities || [],
    isActive: venue.isActive !== false,
    hours:
      venue.hours ||
      `${venue.openingTime || ''} – ${venue.closingTime || ''}`,
    price:
      venue.price ||
      `${venue.currency || 'PKR'} ${venue.hourlyRate || 0}/hour`,
    label: venue.label || '',
  };
}
function normalizeBooking(booking) {
  const venue =
    booking.venueId && typeof booking.venueId === 'object'
      ? booking.venueId
      : null;

  const rawDate = booking.date;
  let dateOnly = '';

  if (rawDate) {
    if (typeof rawDate === 'string') {
      dateOnly = rawDate.slice(0, 10);
    } else {
      const parsed = new Date(rawDate);

      if (!Number.isNaN(parsed.getTime())) {
        dateOnly = parsed.toISOString().slice(0, 10);
      }
    }
  }

  return {
    id: String(
      booking.bookingCode ||
      booking._id ||
      booking.id ||
      '',
    ),

    bookingId: String(
      booking._id ||
      booking.bookingId ||
      '',
    ),

    venueId: String(
      venue?._id ||
      booking.venueId ||
      '',
    ),

    venueName:
      venue?.name ||
      booking.venueName ||
      'Event Venue',

    venueImage:
      venue?.images?.[0] ||
      booking.venueImage ||
      '',

    date: dateOnly,

    dateObj: dateOnly
      ? new Date(`${dateOnly}T12:00:00`)
      : null,

    start: booking.start || booking.startTime || '',
    end: booking.end || booking.endTime || '',

    guests: Number(booking.guests || 0),

    purpose: booking.purpose || '',
    notes: booking.notes || '',

    status: normalizeStatus(booking.status),
    rejectionReason: booking.rejectionReason || '',
    residentName: booking.residentId?.fullName || booking.resident?.fullName || '',
    residentEmail: booking.residentId?.email || booking.resident?.email || '',

    createdAt: booking.createdAt || '',
  };
}
export const eventBookingApi = {
  async getVenues(token) {
    const data = await request('/events/venues', {token});

    return (data.venues || []).map(normalizeVenue);
  },

  async getMyBookings(token) {
    const data = await request('/events/bookings/my', {token});

    return (data.bookings || []).map(normalizeBooking);
  },

  async createBooking(payload, token) {
    const data = await request('/events/bookings', {
      method: 'POST',
      token,
      body: {
        venueId: payload.venueId,
        date: payload.date,
        start: payload.start,
        end: payload.end,
        guests: payload.guests,
        purpose: payload.purpose,
        notes: payload.notes || '',
      },
    });

    return normalizeBooking(data.booking);
  },

  async checkAvailability(venueId, date, token) {
    return request(
      `/events/availability?venueId=${encodeURIComponent(venueId)}&date=${encodeURIComponent(date)}`,
      {token},
    );
  },

  async getAdminBookings(token, status = '') {
    const query = status ? `?status=${encodeURIComponent(status.toLowerCase())}` : '';
    const data = await request(`/events/admin/bookings${query}`, {token});
    return (data.bookings || []).map(normalizeBooking);
  },

  async approveBooking(bookingId, token) {
    return request(`/events/admin/bookings/${encodeURIComponent(bookingId)}/approve`, {method: 'PATCH', token});
  },

  async rejectBooking(bookingId, reason, token) {
    return request(`/events/admin/bookings/${encodeURIComponent(bookingId)}/reject`, {method: 'PATCH', token, body: {reason}});
  },

  async createVenue(payload, token) {
    return request('/events/admin/venues', {method: 'POST', token, body: payload});
  },

  async updateVenue(venueId, payload, token) {
    return request(`/events/admin/venues/${encodeURIComponent(venueId)}`, {method: 'PATCH', token, body: payload});
  },

  async deactivateVenue(venueId, token) {
    return request(`/events/admin/venues/${encodeURIComponent(venueId)}/deactivate`, {method: 'PATCH', token});
  },
};

export default eventBookingApi;
