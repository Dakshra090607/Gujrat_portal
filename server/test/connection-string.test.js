import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNeonSslMode } from '../src/config/connection-string.js';

test('Neon URLs use full certificate and hostname verification', () => {
  const url = normalizeNeonSslMode('postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
  assert.equal(new URL(url).searchParams.get('sslmode'), 'verify-full');
  assert.equal(new URL(url).searchParams.get('channel_binding'), 'require');
});

test('connection strings for non-Neon hosts keep their requested SSL mode', () => {
  const url = normalizeNeonSslMode('postgresql://user:password@localhost:5432/test?sslmode=require');
  assert.equal(new URL(url).searchParams.get('sslmode'), 'require');
});
