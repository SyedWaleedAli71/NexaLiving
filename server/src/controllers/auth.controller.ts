import {Request, Response, NextFunction} from 'express';
import {HydratedDocument} from 'mongoose';
import User, {IUser} from '../models/User';
import {signToken} from '../utils/token';
import {sendOtpEmail} from '../utils/mailer';
import config from '../config/env';

function publicUser(user: HydratedDocument<IUser>) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    isVerified: user.isVerified,
  };
}

// POST /api/auth/register
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {fullName, email, password} = req.body as {
      fullName: string;
      email: string;
      password: string;
    };

    const existing = await User.findOne({email: email.toLowerCase()});
    if (existing) {
      res
        .status(409)
        .json({message: 'An account with this email already exists'});
      return;
    }

    const user = new User({fullName, email, password});
    const code = await user.generateOtp('verify', config.otpTtlMinutes);
    await user.save();

    await sendOtpEmail({
      to: user.email,
      name: user.fullName,
      code,
      purpose: 'verify',
      ttlMinutes: config.otpTtlMinutes,
    });

    res.status(201).json({
      message: 'Account created. Verification code sent to your email.',
      email: user.email,
      requiresVerification: true,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-otp
export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {email, code} = req.body as {email: string; code: string};

    const user = await User.findOne({email: email.toLowerCase()}).select(
      '+verificationCode +verificationCodeExpires',
    );
    if (!user) {
      res.status(404).json({message: 'No account found for this email'});
      return;
    }

    const valid = await user.compareOtp('verify', code);
    if (!valid) {
      res
        .status(400)
        .json({message: 'Invalid or expired verification code'});
      return;
    }

    user.isVerified = true;
    user.clearOtp('verify');
    await user.save();

    res.json({
      message: 'Email verified successfully',
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/resend-otp
export async function resendOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {email} = req.body as {email: string};

    const user = await User.findOne({email: email.toLowerCase()});
    if (!user) {
      // Do not reveal whether the account exists.
      res.json({message: 'If an account exists, a code has been sent'});
      return;
    }
    if (user.isVerified) {
      res.status(400).json({message: 'This account is already verified'});
      return;
    }

    const code = await user.generateOtp('verify', config.otpTtlMinutes);
    await user.save();

    await sendOtpEmail({
      to: user.email,
      name: user.fullName,
      code,
      purpose: 'verify',
      ttlMinutes: config.otpTtlMinutes,
    });

    res.json({message: 'A new verification code has been sent'});
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {email, password} = req.body as {email: string; password: string};

    const user = await User.findOne({email: email.toLowerCase()}).select(
      '+password',
    );
    if (!user) {
      res.status(401).json({message: 'Invalid email or password'});
      return;
    }

    const match = await user.comparePassword(password);
    if (!match) {
      res.status(401).json({message: 'Invalid email or password'});
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        message: 'Email not verified. Please enter the code sent to you.',
        requiresVerification: true,
        email: user.email,
      });
      return;
    }

    res.json({
      message: 'Login successful',
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {email} = req.body as {email: string};

    const user = await User.findOne({email: email.toLowerCase()});
    if (user) {
      const code = await user.generateOtp('reset', config.otpTtlMinutes);
      await user.save();

      await sendOtpEmail({
        to: user.email,
        name: user.fullName,
        code,
        purpose: 'reset',
        ttlMinutes: config.otpTtlMinutes,
      });
    }

    // Always the same response to avoid account enumeration.
    res.json({
      message:
        'If an account exists for this email, reset instructions have been sent.',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {email, code, newPassword} = req.body as {
      email: string;
      code: string;
      newPassword: string;
    };

    const user = await User.findOne({email: email.toLowerCase()}).select(
      '+resetCode +resetCodeExpires',
    );
    if (!user) {
      res.status(404).json({message: 'No account found for this email'});
      return;
    }

    const valid = await user.compareOtp('reset', code);
    if (!valid) {
      res.status(400).json({message: 'Invalid or expired reset code'});
      return;
    }

    user.password = newPassword;
    user.clearOtp('reset');
    // Setting password via save() triggers the hashing pre-hook.
    await user.save();

    res.json({message: 'Password reset successfully'});
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me  (protected - powers the Home page)
export function me(req: Request, res: Response): void {
  res.json({user: publicUser(req.user as HydratedDocument<IUser>)});
}
