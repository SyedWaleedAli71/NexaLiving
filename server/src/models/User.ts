import mongoose, {Schema, Model} from 'mongoose';
import bcrypt from 'bcryptjs';

export type OtpField = 'verify' | 'reset';

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationCode: string | null;
  verificationCodeExpires: Date | null;
  resetCode: string | null;
  resetCodeExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  generateOtp(field: OtpField, ttlMinutes: number): Promise<string>;
  compareOtp(field: OtpField, candidate: string): Promise<boolean>;
  clearOtp(field: OtpField): void;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    isVerified: {type: Boolean, default: false},
    verificationCode: {type: String, select: false, default: null},
    verificationCodeExpires: {type: Date, select: false, default: null},
    resetCode: {type: String, select: false, default: null},
    resetCodeExpires: {type: Date, select: false, default: null},
  },
  {timestamps: true},
);

// Hash password whenever it is set/changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

// Generate a 6-digit numeric OTP, store its hash + expiry, return the plain code.
userSchema.methods.generateOtp = async function (
  field: OtpField,
  ttlMinutes: number,
) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hashed = await bcrypt.hash(code, 8);
  const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);

  if (field === 'reset') {
    this.resetCode = hashed;
    this.resetCodeExpires = expires;
  } else {
    this.verificationCode = hashed;
    this.verificationCodeExpires = expires;
  }

  return code;
};

userSchema.methods.compareOtp = function (field: OtpField, candidate: string) {
  const hash = field === 'reset' ? this.resetCode : this.verificationCode;
  const expires =
    field === 'reset' ? this.resetCodeExpires : this.verificationCodeExpires;

  if (!hash || !expires || expires.getTime() < Date.now()) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidate, hash);
};

userSchema.methods.clearOtp = function (field: OtpField) {
  if (field === 'reset') {
    this.resetCode = null;
    this.resetCodeExpires = null;
  } else {
    this.verificationCode = null;
    this.verificationCodeExpires = null;
  }
};

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
