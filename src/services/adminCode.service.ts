import * as crypto from 'crypto';
import { ADMIN_CODES } from '../config/adminCodes';
const sha = (s: string) => crypto.createHash('sha256').update(String(s)).digest();
export function isValidAdminCode(input?: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const given = sha(input.trim());
  return ADMIN_CODES.some((code) => {
    const h = sha(code);
    return h.length === given.length && crypto.timingSafeEqual(given, h);
  });
}
