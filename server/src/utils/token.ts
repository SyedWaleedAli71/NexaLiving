import jwt from 'jsonwebtoken';
import {HydratedDocument} from 'mongoose';
import config from '../config/env';
import {IUser} from '../models/User';

export interface TokenPayload {
  sub: string;
  email: string;
}

export function signToken(user: HydratedDocument<IUser>): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: user._id.toString(),
    email: user.email,
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
