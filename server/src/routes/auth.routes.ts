import express from 'express';
import {body} from 'express-validator';
import validate from '../middleware/validate';
import requireAuth from '../middleware/auth';
import * as ctrl from '../controllers/auth.controller';

const router = express.Router();

const emailRule = body('email')
  .isEmail()
  .withMessage('Enter a valid email address')
  .normalizeEmail();

const passwordRule = body('password')
  .isLength({min: 8})
  .withMessage('Password must be at least 8 characters');

const codeRule = body('code')
  .isNumeric()
  .withMessage('Code must be numeric')
  .isLength({min: 6, max: 6})
  .withMessage('Code must be 6 digits');

const newPasswordRule = body('newPassword')
  .isLength({min: 8})
  .withMessage('Password must be at least 8 characters');

// POST /api/auth/register
router.post(
  '/register',
  validate([
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    emailRule,
    passwordRule,
  ]),
  ctrl.register,
);

// POST /api/auth/verify-otp
router.post('/verify-otp', validate([emailRule, codeRule]), ctrl.verifyOtp);

// POST /api/auth/resend-otp
router.post('/resend-otp', validate([emailRule]), ctrl.resendOtp);

// POST /api/auth/login
router.post(
  '/login',
  validate([
    emailRule,
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  ctrl.login,
);

// POST /api/auth/forgot-password
router.post('/forgot-password', validate([emailRule]), ctrl.forgotPassword);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  validate([emailRule, codeRule, newPasswordRule]),
  ctrl.resetPassword,
);

// GET /api/auth/me (protected - Home page data)
router.get('/me', requireAuth, ctrl.me);

export default router;
