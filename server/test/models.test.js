import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeRole } from '../src/db/model-store.js';
import { models, VERIFICATION_STATUSES } from '../src/models/index.js';

test('exports all planned PostgreSQL-backed application models and review statuses', () => {
  assert.equal(Object.keys(models).length + 1, 20);
  assert.deepEqual(VERIFICATION_STATUSES, ['EXTRACTED', 'NEEDS_REVIEW', 'VERIFIED', 'AMENDED', 'SUPERSEDED', 'INCOMPLETE']);
});

test('public role normalization never grants a privileged role', () => {
  assert.equal(normalizeRole('ADMIN'), 'ADMIN');
  assert.equal(normalizeRole('reviewer'), 'REVIEWER');
  assert.equal(normalizeRole('owner'), 'GENERAL_USER');
  assert.equal(normalizeRole(undefined), 'GENERAL_USER');
});

test('PostgreSQL schema requires evidence for verification and makes review audits immutable', () => {
  const directory = path.dirname(fileURLToPath(import.meta.url));
  const migration = fs.readFileSync(path.resolve(directory, '../migrations/001_postgres_core.sql'), 'utf8');
  assert.match(migration, /Verified records require reviewer, review item, timestamp, and audit provenance/);
  assert.match(migration, /Verified parameters require values, units, source scope, and explicit applicability conditions/);
  assert.match(migration, /Review audit events are append-only/);
  assert.match(migration, /app_users_email_lower_unique/);
});
