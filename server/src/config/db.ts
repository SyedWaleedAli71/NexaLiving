import mongoose from 'mongoose';
import config from './env';

async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoURI);
  console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
}

export default connectDB;
