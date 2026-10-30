import app from './app';
import connectDB from './config/db';
import config from './config/env';

async function start(): Promise<void> {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`[server] NexaLiving API listening on port ${config.port}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', (err as Error).message);
    process.exit(1);
  }
}

start();
