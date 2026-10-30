import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  mongoURI: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  otpTtlMinutes: number;
  clientBaseUrl: string;
  smtp: {
    host?: string;
    port: number;
    secure: boolean;
    user?: string;
    pass?: string;
  };
  mailFrom: string;
}

const config: AppConfig = {
  port: Number(process.env.PORT) || 5000,
  mongoURI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexaliving',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES) || 10,
  clientBaseUrl: process.env.CLIENT_BASE_URL || 'http://localhost:5000',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  mailFrom: process.env.MAIL_FROM || 'NexaLiving <no-reply@nexaliving.com>',
};

export default config;
