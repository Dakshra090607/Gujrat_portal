import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(serverRoot, '..');
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  console.error('Set TEST_DATABASE_URL to a disposable Neon branch before running integration tests.');
  process.exit(1);
}

const localEnvPath = path.join(projectRoot, '.env.local');
const projectEnv = fs.existsSync(localEnvPath) ? dotenv.parse(fs.readFileSync(localEnvPath)) : {};
try {
  const test = new URL(testUrl);
  const application = projectEnv.DATABASE_URL ? new URL(projectEnv.DATABASE_URL) : null;
  if (!['postgres:', 'postgresql:'].includes(test.protocol) || !test.hostname.endsWith('.neon.tech') || !application || test.hostname.toLowerCase() === application.hostname.toLowerCase()) {
    throw new Error();
  }
} catch {
  console.error('TEST_DATABASE_URL must use a Neon endpoint different from the configured application branch.');
  process.exit(1);
}

const env = {
  ...process.env,
  BUILDRULE_SKIP_DOTENV: '1',
  BUILDRULE_TEST_DATABASE: '1',
  DATABASE_URL: testUrl,
  DATABASE_URL_UNPOOLED: testUrl,
};
for (const [source, destination] of [['TEST_NEON_AUTH_BASE_URL', 'NEON_AUTH_BASE_URL'], ['TEST_NEON_AUTH_JWKS_URL', 'NEON_AUTH_JWKS_URL']]) {
  if (env[source]) env[destination] = env[source];
}

for (const args of [
  ['--import', './scripts/bootstrap-env.js', './scripts/migrate.js'],
  ['--import', './scripts/bootstrap-env.js', '--test', './test/review.integration.test.js'],
]) {
  const result = spawnSync(process.execPath, args, { cwd: serverRoot, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
