import './config/env.js';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

if (!process.env.VERCEL) {
  try {
    try {
      await connectDatabase();
      console.log('PostgreSQL connected.');
    } catch (error) {
      console.error('PostgreSQL unavailable; database-backed routes will return 503.');
    }
    const server = app.listen(port, () => console.log(`BuildRule Gujarat API listening on ${port}`));
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, async () => {
        server?.close();
        await disconnectDatabase();
        process.exit(0);
      });
    }
  } catch (error) {
    console.error(`Could not start API: ${error.message}`);
    process.exitCode = 1;
    await disconnectDatabase();
  }
}

export default app;
