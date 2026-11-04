import { app } from './app';
import { connectDB } from './config/db';
import { env, isProd } from './config/env';
import { logger } from './utils/logger';
import { ADMIN_CODES, usingFallbackCodes } from './config/adminCodes';
import { startJobs } from './jobs';

async function main() {
  await connectDB();
  if (isProd && usingFallbackCodes) {
    logger.warn('Using fallback admin signup codes. Set ADMIN_SIGNUP_CODES in .env for production.');
  }
  app.listen(env.PORT, () => {
    logger.info('NexaLiving backend listening on port ' + env.PORT);
    logger.info('Admin codes loaded: ' + ADMIN_CODES.length);
    startJobs();
  });
}

main().catch((e) => { logger.error(e, 'Fatal startup error'); process.exit(1); });