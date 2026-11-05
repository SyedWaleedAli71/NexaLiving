import mongoose, {Schema, Model, Types} from 'mongoose';

export interface IEventVenue {
  societyId: Types.ObjectId;
  name: string;
  description: string;
  location: string;
  capacity: number;
  hourlyRate: number;
  currency: string;
  images: string[];
  amenities: string[];
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  bookingLockToken?: string;
  bookingLockExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventVenueSchema = new Schema<IEventVenue>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'PKR',
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },

    images: {
      type: [String],
      default: [],
    },

    amenities: {
      type: [String],
      default: [],
    },

    openingTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    closingTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Short lease used to serialize booking writes on standalone MongoDB too.
    bookingLockToken: {
      type: String,
      select: false,
    },

    bookingLockExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

eventVenueSchema.index({
  societyId: 1,
  isActive: 1,
});

const EventVenue: Model<IEventVenue> =
  mongoose.models.EventVenue ||
  mongoose.model<IEventVenue>('EventVenue', eventVenueSchema);

export default EventVenue;
