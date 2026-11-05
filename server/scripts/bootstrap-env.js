import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

process.env.BUILDRULE_SKIP_DOTENV = '1';
for (const name of ['DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'NEON_AUTH_BASE_URL', 'NEON_AUTH_JWKS_URL']) delete process.env[name];

if (process.env.BUILDRULE_TEST_DATABASE === '1') {
  const serverRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const projectRoot = path.resolve(serverRoot, '..');
  const localEnvPath = path.join(projectRoot, '.env.local');
  const projectEnv = fs.existsSync(localEnvPath) ? dotenv.parse(fs.readFileSync(localEnvPath)) : {};
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) throw new Error('Set TEST_DATABASE_URL to a disposable Neon branch before running integration tests.');
  const test = new URL(testUrl);
  const application = projectEnv.DATABASE_URL ? new URL(projectEnv.DATABASE_URL) : null;
  if (!['postgres:', 'postgresql:'].includes(test.protocol) || !test.hostname.endsWith('.neon.tech')) {
    throw new Error('TEST_DATABASE_URL must be a PostgreSQL URL for a Neon branch endpoint.');
  }
  if (!application || test.hostname.toLowerCase() === application.hostname.toLowerCase()) {
    throw new Error('TEST_DATABASE_URL must point to a Neon endpoint different from the application branch.');
  }
  process.env.TEST_APPLICATION_DATABASE_URL = projectEnv.DATABASE_URL;
  process.env.DATABASE_URL = testUrl;
  process.env.DATABASE_URL_UNPOOLED = testUrl;
  if (process.env.TEST_NEON_AUTH_BASE_URL) process.env.NEON_AUTH_BASE_URL = process.env.TEST_NEON_AUTH_BASE_URL;
  if (process.env.TEST_NEON_AUTH_JWKS_URL) process.env.NEON_AUTH_JWKS_URL = process.env.TEST_NEON_AUTH_JWKS_URL;
}
