import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const port = 54329;
  const user = 'postgres';
  const password = 'password';
  const dbDir = path.resolve(__dirname, '../data/postgres');

  console.log(`[DB] Initializing PostgreSQL cluster in ${dbDir} on port ${port}...`);

  const em = new EmbeddedPostgres({
    databaseDir: dbDir,
    port: port,
    user: user,
    password: password,
    persistent: true,
  });

  try {
    await em.initialise();
  } catch (err: unknown) {
    // Already initialised is fine
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already exists') && !msg.includes('ok')) {
      console.log('[DB] Notice during initialization:', msg);
    }
  }

  await em.start();
  console.log(`[DB] ✓ PostgreSQL 18 server running on 127.0.0.1:${port}`);

  // Ensure 'coursereg' database exists
  const adminClient = new pg.Client({
    host: '127.0.0.1',
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const checkDb = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'coursereg'"
    );
    if (checkDb.rowCount === 0) {
      await adminClient.query('CREATE DATABASE coursereg');
      console.log("[DB] ✓ Database 'coursereg' successfully created");
    } else {
      console.log("[DB] ✓ Database 'coursereg' ready");
    }
  } catch (err) {
    console.error('[DB] Error checking database existence:', err);
  } finally {
    await adminClient.end();
  }

  console.log('[DB] PostgreSQL server is ready for connections.');

  const shutdown = async () => {
    console.log('\n[DB] Stopping PostgreSQL...');
    await em.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

run().catch((err) => {
  console.error('[DB] Fatal error starting PostgreSQL:', err);
  process.exit(1);
});
