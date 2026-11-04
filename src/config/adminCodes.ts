import { env } from './env';

// Fallback codes committed to code. In production set ADMIN_SIGNUP_CODES in .env.
// ROTATE these before the first real deployment.
const FALLBACK_CODES = [
  'NEXA-ADMIN-7Q4K-2026',
  'NEXA-ADMIN-M9XP-2026',
];

const fromEnv = (env.ADMIN_SIGNUP_CODES || '')
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean);

export const ADMIN_CODES: string[] = fromEnv.length ? fromEnv : FALLBACK_CODES;
export const usingFallbackCodes = fromEnv.length === 0;
