import mongoose, {Schema, Model, Types} from 'mongoose';
import {randomBytes} from 'crypto';

export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface IEventBooking {
  bookingCode: string;

  societyId: Types.ObjectId;
  venueId: Types.ObjectId;
  residentId: Types.ObjectId;

  date: string;
  start: string;
  end: string;

  guests: number;
  purpose: string;
  notes: string;

  status: BookingStatus;

  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const eventBookingSchema = new Schema<IEventBooking>(
  {
    bookingCode: {
      type: String,
      unique: true,
      index: true,
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },

    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'EventVenue',
      required: true,
      index: true,
    },

    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Format: YYYY-MM-DD
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    // Format: HH:mm (24-hour)
    start: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    end: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    guests: {
      type: Number,
      required: true,
      min: 1,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically generate a booking reference.
eventBookingSchema.pre('validate', function () {
  if (!this.bookingCode) {
    this.bookingCode =
      `NXL-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  if (this.start && this.end && this.end <= this.start) {
    this.invalidate(
      'end',
      'End time must be later than start time.',
    );
  }
});

// Resident booking history.
eventBookingSchema.index({
  residentId: 1,
  createdAt: -1,
});

// Admin pending-booking list.
eventBookingSchema.index({
  societyId: 1,
  status: 1,
  createdAt: -1,
});

// Venue/date availability queries.
eventBookingSchema.index({
  societyId: 1,
  venueId: 1,
  date: 1,
  status: 1,
});

const EventBooking: Model<IEventBooking> =
  mongoose.models.EventBooking ||
  mongoose.model<IEventBooking>(
    'EventBooking',
    eventBookingSchema,
  );

export default EventBooking;
