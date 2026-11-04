import mongoose from 'mongoose';
import { env, isTest } from './env';
import { logger } from '../utils/logger';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  if (isTest) return;
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error({ err }, 'MongoDB connection error');
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
}

export function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

export { mongoose };
