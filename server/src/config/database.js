import './env.js';
import { Pool } from 'pg';
import { normalizeNeonSslMode } from './connection-string.js';

let pool;

function getPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is missing. Run `neon env pull` from the project root.');
  if (!pool) {
    pool = new Pool({
      connectionString: normalizeNeonSslMode(connectionString),
      max: Number.parseInt(process.env.PG_POOL_MAX ?? '5', 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      application_name: 'buildrule-gujarat-api',
    });
    pool.on('error', (error) => {
      // Do not log connection strings or driver error detail, which can contain
      // endpoint metadata. The health route exposes only ready/unavailable.
      console.error(`PostgreSQL pool error: ${error.code ?? 'unknown error'}`);
    });
  }
  return pool;
}

export const db = {
  query(text, values = [], client = null) {
    return (client ?? getPool()).query(text, values);
  },
  async connect() {
    const client = await getPool().connect();
    return client;
  },
  async isConnected() {
    try {
      await getPool().query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },
};

export async function connectDatabase() {
  const result = await getPool().query('SELECT current_database() AS database, current_schema() AS schema');
  return result.rows[0];
}

export async function disconnectDatabase() {
  if (pool) {
    const current = pool;
    pool = undefined;
    await current.end();
  }
}

export async function withTransaction(operation, client = null) {
  if (client) return operation(client);
  const connection = await getPool().connect();
  try {
    await connection.query('BEGIN');
    const result = await operation(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    await connection.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

export function startSession() {
  return {
    client: null,
    async withTransaction(operation) {
      const connection = await getPool().connect();
      this.client = connection;
      try {
        await connection.query('BEGIN');
        const result = await operation(this);
        await connection.query('COMMIT');
        return result;
      } catch (error) {
        await connection.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        connection.release();
        this.client = null;
      }
    },
    async endSession() {
      if (this.client) {
        this.client.release();
        this.client = null;
      }
    },
  };
}

export function connectionFor(session) {
  return session?.client ?? null;
}

export function assertIsolatedTestDatabase(testUrl, applicationUrl) {
  if (!testUrl) throw new Error('TEST_DATABASE_URL must point to a disposable Neon test branch.');
  let test;
  try { test = new URL(testUrl); } catch { throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(test.protocol)) throw new Error('TEST_DATABASE_URL must use PostgreSQL.');
  if (!test.hostname.endsWith('.neon.tech')) throw new Error('TEST_DATABASE_URL must use an isolated Neon branch endpoint.');
  if (!applicationUrl) throw new Error('The application database URL must be supplied for the isolation check.');
  let application;
  try { application = new URL(applicationUrl); } catch { throw new Error('The application database URL is invalid.'); }
  if (test.hostname.toLowerCase() === application.hostname.toLowerCase()) {
    throw new Error('TEST_DATABASE_URL points to the application database endpoint.');
  }
}
