import { User } from '../models/User';
import { Membership } from '../models/Membership';
import { ApiError } from '../utils/ApiError';
import { normalizePkPhone } from '../utils/phone';
import { processAndStoreImage, deleteByPublicId } from './storage.service';
import { TutorProfile } from '../models/TutorProfile';
import { Item } from '../models/Item';
import { Rental } from '../models/Rental';
import { Service } from '../models/Service';
import { Carpool } from '../models/Carpool';
import { revokeAllForUser, bumpTokenVersion } from './token.service';
import bcrypt from 'bcryptjs';

export async function updateProfile(userId: string, patch: any) {
  const update: any = {};
  const allowed = ['fullName', 'bio', 'showPhoneInDirectory', 'showInDirectory', 'skills'];
  for (const k of allowed) if (patch[k] !== undefined) update[k] = patch[k];
  if (patch.phone) update.phone = normalizePkPhone(patch.phone);
  const u = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
  if (!u) throw ApiError.notFound();
  return u.toPublicJSON();
}

export async function updateSettings(userId: string, patch: any) {
  const set: any = {};
  if (patch.theme) set['settings.theme'] = patch.theme;
  if (patch.notifications) {
    for (const [k, v] of Object.entries(patch.notifications)) set['settings.notifications.' + k] = v;
  }
  const u = await User.findByIdAndUpdate(userId, { $set: set }, { new: true }).select('settings');
  if (!u) throw ApiError.notFound();
  return u.settings;
}

export async function setAvatar(userId: string, buffer: Buffer) {
  const u: any = await User.findById(userId);
  if (!u) throw ApiError.notFound();
  const img = await processAndStoreImage(buffer, { folder: 'avatars', width: 512, height: 512 });
  if (u.avatar?.publicId) await deleteByPublicId(u.avatar.publicId).catch(() => {});
  u.avatar = img;
  await u.save();
  return u.avatar;
}

export async function removeAvatar(userId: string) {
  const u: any = await User.findById(userId);
  if (!u) throw ApiError.notFound();
  if (u.avatar?.publicId) await deleteByPublicId(u.avatar.publicId).catch(() => {});
  u.avatar = undefined;
  await u.save();
}

export async function addPushToken(userId: string, token: string, platform: 'android' | 'ios') {
  await User.updateMany({ _id: { $ne: userId }, 'pushTokens.token': token }, { $pull: { pushTokens: { token } } });
  await User.updateOne({ _id: userId, 'pushTokens.token': { $ne: token } }, { $addToSet: { pushTokens: { token, platform, addedAt: new Date() } } });
  const u: any = await User.findById(userId).select('pushTokens');
  if (u && u.pushTokens.length > 5) {
    const trimmed = u.pushTokens.slice(-5);
    await User.updateOne({ _id: userId }, { $set: { pushTokens: trimmed } });
  }
}

export async function removePushToken(userId: string, token: string) {
  await User.updateOne({ _id: userId }, { $pull: { pushTokens: { token } } });
}

export async function getProfile(userId: string, viewerId: string, societyId: string) {
  const [a, b]: any[] = await Promise.all([
    Membership.findOne({ user: viewerId, society: societyId, status: 'active' }).lean(),
    Membership.findOne({ user: userId, society: societyId, status: 'active' }).populate('user', 'fullName email phone avatar bio skills showPhoneInDirectory showInDirectory isVerifiedResident isTutor isServiceProvider').lean(),
  ]);
  if (!a || !b) throw ApiError.notFound();
  const target: any = (b as any).user;
  const profile = {
    _id: target._id, fullName: target.fullName, avatar: target.avatar, bio: target.bio, skills: target.skills,
    block: b.block, memberSince: b.createdAt, isVerifiedResident: b.isVerifiedResident,
    isTutor: b.isTutor, isServiceProvider: b.isServiceProvider,
  };
  const showPhone = target.showPhoneInDirectory;
  if (showPhone) (profile as any).phone = target.phone;
  return profile;
}

export async function deleteAccount(userId: string, password: string) {
  const u: any = await User.findById(userId).select('+passwordHash');
  if (!u) throw ApiError.notFound();
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) throw ApiError.badRequest('WRONG_PASSWORD', 'Password incorrect');
  const adminCount = await Membership.countDocuments({ user: userId, role: 'admin', status: 'active' });
  if (adminCount > 0) {
    const societies = await Membership.find({ user: userId, role: 'admin', status: 'active' }).select('society').lean();
    for (const m of societies as any[]) {
      const others = await Membership.countDocuments({ society: m.society, role: 'admin', status: 'active', _id: { $ne: m._id } });
      if (others === 0) throw ApiError.conflict('LAST_ADMIN', 'You are the last admin of a society; promote someone first');
    }
  }
  u.deletedAt = new Date();
  u.fullName = 'Deleted user';
  u.phone = ''; u.avatar = undefined; u.pushTokens = [];
  await u.save();
  await Membership.updateMany({ user: userId }, { $set: { status: 'left' } });
  await Promise.all([
    TutorProfile.updateMany({ user: userId }, { $set: { isActive: false, isHidden: true, hiddenReason: 'account_deleted' } }),
    Item.updateMany({ owner: userId }, { $set: { status: 'paused', isHidden: true, hiddenReason: 'account_deleted' } }),
    Rental.updateMany({ owner: userId }, { $set: { status: 'paused', isHidden: true, hiddenReason: 'account_deleted' } }),
    Service.updateMany({ owner: userId }, { $set: { status: 'rejected', isHidden: true, hiddenReason: 'account_deleted' } }),
    Carpool.updateMany({ driver: userId }, { $set: { status: 'cancelled' } }),
  ]);
  await revokeAllForUser(userId);
  await bumpTokenVersion(userId);
}
