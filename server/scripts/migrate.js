import '../src/config/env.js';
import { Client } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeNeonSslMode } from '../src/config/connection-string.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(scriptDir, '../migrations');
const connectionString = process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) throw new Error('DATABASE_URL_UNPOOLED is missing. Run `neon env pull` and keep the direct URL for migrations.');

const client = new Client({ connectionString: normalizeNeonSslMode(connectionString), application_name: 'buildrule-gujarat-migrations', connectionTimeoutMillis: 10_000 });
try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock(hashtext($1))', ['buildrule-gujarat-schema-migrations']);
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const files = (await fs.readdir(migrationsDir)).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (applied.rowCount) continue;
    const sql = await fs.readFile(path.join(migrationsDir, name), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applied PostgreSQL migration: ${name}`);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    }
  }
  console.log('PostgreSQL schema migrations are current.');
} catch (error) {
  console.error(`PostgreSQL migration failed: ${error.code ?? 'unknown error'} ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.query('SELECT pg_advisory_unlock(hashtext($1))', ['buildrule-gujarat-schema-migrations']).catch(() => {});
  await client.end().catch(() => {});
}
