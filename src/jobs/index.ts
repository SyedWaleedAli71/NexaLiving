import * as cron from 'node-cron';
import { logger } from '../utils/logger';
export function startJobs() {
  // Booking reminders every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try { const { runBookingReminders } = require('./bookingReminder.job'); await runBookingReminders(); }
    catch (e) { logger.error(e, 'booking reminders failed'); }
  });
  // Overdue item check daily at 09:00
  cron.schedule('0 9 * * *', async () => {
    try { const { runOverdueItems } = require('./overdueItems.job'); await runOverdueItems(); }
    catch (e) { logger.error(e, 'overdue items check failed'); }
  });
  // Expire needs daily at 03:00
  cron.schedule('0 3 * * *', async () => {
    try { const { runNeedExpiry } = require('./needExpiry.job'); await runNeedExpiry(); }
    catch (e) { logger.error(e, 'need expiry failed'); }
  });
  // Complete past bookings hourly
  cron.schedule('5 * * * *', async () => {
    try { const { runBookingComplete } = require('./bookingComplete.job'); await runBookingComplete(); }
    catch (e) { logger.error(e, 'booking completion failed'); }
  });
  logger.info('Background jobs started');
}
