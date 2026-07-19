import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const formatAuthUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  avatar: user.avatar || '',
  provider: user.provider || 'local',
  isVerified: user.isVerified,
  role: user.role,
  vendorStatus: user.vendorStatus,
  companyName: user.companyName,
  businessType: user.businessType,
  taxId: user.taxId,
  yearsInIndustry: user.yearsInIndustry,
  philosophy: user.philosophy,
  phone: user.phone,
  occupation: user.occupation,
  streetAddress: user.streetAddress,
  city: user.city,
  state: user.state,
  zipCode: user.zipCode,
});

export const signAuthToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'homespace_secret', {
    expiresIn: '7d',
  });

/**
 * Find or create a user from a verified OAuth profile.
 * Links by provider id first, then by email.
 */
export const upsertOAuthUser = async ({
  provider,
  providerId,
  email,
  fullName,
  avatar,
}) => {
  if (!email) {
    throw new Error(`${provider} account did not provide an email address`);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const idField = provider === 'google' ? 'googleId' : 'facebookId';

  let user = await User.findOne({ [idField]: providerId });

  if (!user) {
    user = await User.findOne({ email: normalizedEmail });
  }

  if (user) {
    user[idField] = providerId;
    user.provider = user.provider === 'local' ? 'local' : provider;
    user.isVerified = true;
    if (avatar && !user.avatar) user.avatar = avatar;
    if (fullName && (!user.fullName || user.fullName === 'User')) {
      user.fullName = fullName;
    }
    await user.save();
    return user;
  }

  const randomPassword = crypto.randomBytes(32).toString('hex');
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  user = await User.create({
    fullName: fullName || normalizedEmail.split('@')[0],
    email: normalizedEmail,
    password: hashedPassword,
    isVerified: true,
    provider,
    [idField]: providerId,
    avatar: avatar || '',
    role: 'customer',
  });

  return user;
};
