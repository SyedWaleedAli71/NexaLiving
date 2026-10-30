import {Request, Response, NextFunction} from 'express';
import {verifyToken} from '../utils/token';
import User from '../models/User';

// Protects routes: requires "Authorization: Bearer <token>" for a verified user.
export default async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      res.status(401).json({message: 'Authentication token is required'});
      return;
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      res.status(401).json({message: 'Account no longer exists'});
      return;
    }
    if (!user.isVerified) {
      res.status(403).json({message: 'Email not verified'});
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({message: 'Invalid or expired token'});
  }
}
