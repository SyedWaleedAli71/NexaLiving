import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Membership } from '../models/Membership';
import { RefreshToken } from '../models/RefreshToken';
import { ApiError } from '../utils/ApiError';
import { issueTokenPair, verifyRefreshJwt, revokeRefreshToken, revokeAllForUser, bumpTokenVersion, signResetToken, verifyResetToken } from './token.service';
import { isValidAdminCode } from './adminCode.service';
import { audit } from './audit.service';
import { sha256, generateOtp } from './crypto.service';
import { normalizePkPhone } from '../utils/phone';
import { sendMail, passwordResetEmail, passwordChangedEmail } from './mail.service';

export async function register(input: any, ip?: string) {
  const email = String(input.email).toLowerCase();
  const exists = await User.exists({ email });
  if (exists) throw ApiError.conflict('EMAIL_TAKEN', 'Email already registered');
  let globalRole: 'user' | 'admin' = 'user';
  if (input.adminCode) {
    if (!isValidAdminCode(input.adminCode)) throw ApiError.badRequest('INVALID_ADMIN_CODE', 'Invalid admin signup code');
    globalRole = 'admin';
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user: any = await User.create({
    fullName: input.fullName, email, phone: normalizePkPhone(input.phone),
    cnic: input.cnic, passwordHash, globalRole,
  });
  if (globalRole === 'admin') await audit({ actor: String(user._id), action: 'ADMIN_SIGNUP', ip });
  const tokens = await issueTokenPair(user, input.deviceName);
  return { user: user.toPublicJSON(), ...tokens };
}

export async function login(input: any) {
  const email = String(input.email).toLowerCase();
  const user: any = await User.findOne({ email, deletedAt: null }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
  if (user.isBlocked) throw ApiError.forbidden('ACCOUNT_BLOCKED', 'Account is blocked');
  user.lastLoginAt = new Date();
  await user.save();
  const tokens = await issueTokenPair(user, input.deviceName);
  const memberships = await Membership.find({ user: user._id, status: { $in: ['pending', 'active', 'suspended'] } })
    .populate('society', '_id name area city coverImage').lean();
  return { user: user.toPublicJSON(), memberships, ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: any;
  try { payload = verifyRefreshJwt(refreshToken); }
  catch { throw ApiError.unauthorized('INVALID_TOKEN', 'Invalid refresh token'); }
  const hash = sha256(refreshToken).toString('hex');
  const doc: any = await RefreshToken.findOne({ jti: payload.jti });
  if (!doc || doc.tokenHash !== hash) throw ApiError.unauthorized('INVALID_TOKEN', 'Invalid refresh token');
  if (doc.revokedAt) {
    await revokeAllForUser(String(doc.user));
    await bumpTokenVersion(doc.user);
    throw ApiError.unauthorized('TOKEN_REUSED', 'Refresh token reused; sessions revoked');
  }
  if (doc.expiresAt < new Date()) throw ApiError.unauthorized('INVALID_TOKEN', 'Refresh token expired');
  const user: any = await User.findById(doc.user);
  if (!user || user.deletedAt) throw ApiError.unauthorized('INVALID_TOKEN', 'User gone');
  if (user.isBlocked) throw ApiError.forbidden('ACCOUNT_BLOCKED', 'Account is blocked');
  const tokens = await issueTokenPair(user, doc.deviceName);
  doc.revokedAt = new Date();
  await doc.save();
  return tokens;
}

export async function logout(userId: string, refreshToken: string, pushToken?: string) {
  try {
    const payload: any = verifyRefreshJwt(refreshToken);
    await revokeRefreshToken(payload.jti);
  } catch { /* idempotent */ }
  if (pushToken) await User.updateOne({ _id: userId }, { $pull: { pushTokens: { token: pushToken } } });
}

export async function logoutAll(userId: string) {
  await revokeAllForUser(userId);
  await bumpTokenVersion(userId);
  await User.updateOne({ _id: userId }, { $set: { pushTokens: [] } });
}

export async function forgotPassword(email: string) {
  const user: any = await User.findOne({ email: email.toLowerCase(), deletedAt: null });
  if (user) {
    const otp = generateOtp();
    user.resetOtpHash = sha256(otp).toString('hex');
    user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOtpAttempts = 0;
    await user.save();
    const m = passwordResetEmail(otp);
    sendMail(user.email, m.subject, m.html).catch(() => {});
  }
}

export async function verifyOtp(email: string, otp: string) {
  const user: any = await User.findOne({ email: email.toLowerCase() }).select('+resetOtpHash +resetOtpExpiresAt +resetOtpAttempts');
  if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date())
    throw ApiError.badRequest('OTP_INVALID', 'Reset code invalid or expired');
  if (user.resetOtpAttempts >= 5) {
    user.resetOtpHash = undefined; user.resetOtpExpiresAt = undefined; user.resetOtpAttempts = 0;
    await user.save();
    throw ApiError.tooMany('Too many attempts', 'OTP_LOCKED');
  }
  const given = sha256(otp);
  const stored = Buffer.from(user.resetOtpHash, 'hex');
  if (given.length !== stored.length || !crypto.timingSafeEqual(given, stored)) {
    user.resetOtpAttempts += 1;
    await user.save();
    throw ApiError.badRequest('OTP_INVALID', 'Reset code invalid');
  }
  user.resetOtpHash = undefined; user.resetOtpExpiresAt = undefined; user.resetOtpAttempts = 0;
  await user.save();
  return signResetToken(String(user._id));
}

export async function resetPassword(resetToken: string, newPassword: string) {
  let sub: string;
  try { sub = verifyResetToken(resetToken).sub; }
  catch { throw ApiError.unauthorized('INVALID_TOKEN', 'Invalid reset token'); }
  const user: any = await User.findById(sub);
  if (!user) throw ApiError.unauthorized('INVALID_TOKEN', 'Invalid reset token');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  await user.save();
  await revokeAllForUser(String(user._id));
  await bumpTokenVersion(user._id);
  const m = passwordChangedEmail();
  sendMail(user.email, m.subject, m.html).catch(() => {});
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, deviceRefresh?: string) {
  const user: any = await User.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('UNAUTHORIZED', 'User not found');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest('WRONG_PASSWORD', 'Current password incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  await user.save();
  await revokeAllForUser(String(user._id));
  await bumpTokenVersion(user._id);
  return issueTokenPair(user);
}

export async function me(userId: string) {
  const user: any = await User.findById(userId);
  if (!user) throw ApiError.unauthorized('UNAUTHORIZED', 'No session');
  const memberships = await Membership.find({ user: userId, status: { $in: ['pending', 'active', 'suspended'] } })
    .populate('society', '_id name area city coverImage').lean();
  const { Notification } = require('../models/Notification');
  const unreadNotifications = await Notification.countDocuments({ user: userId, readAt: null });
  return { user: user.toPublicJSON(), memberships, unreadNotifications };
}
