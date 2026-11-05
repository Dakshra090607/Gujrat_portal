import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

test('health reports unavailable until PostgreSQL is connected', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    status: 'database_unavailable',
    service: 'buildrule-gujarat-api',
    database: 'disconnected',
  });
});

test('API returns a consistent not-found envelope and security headers', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/missing`);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.deepEqual(await response.json(), { error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

test('search rejects missing and oversized query strings before database access', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const base = `http://127.0.0.1:${server.address().port}/api/v1/search`;
  const missing = await fetch(base);
  const oversized = await fetch(`${base}?q=${'x'.repeat(121)}`);
  const validButUnavailable = await fetch(`${base}?q=FSI`);
  assert.equal(missing.status, 400);
  assert.equal(oversized.status, 400);
  assert.equal(validButUnavailable.status, 503);
  assert.equal((await missing.json()).error.code, 'INVALID_SEARCH');
});

test('FSI API refuses to invent values when verified parameters are absent', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/calculations/fsi`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ developmentAuthority: 'Authority to be verified', zone: 'Zone to be verified', plotArea: 500, roadWidth: 12, buildingUse: 'Residential' }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'UNRESOLVED');
  assert.equal(body.calculation, null);
  assert.match(body.message, /^Unable to establish a verified FSI result/);
});

test('assessment API returns insufficient information instead of compliance claims', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/assessments`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ projectName: 'Review pending project', plotArea: 500 }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, 'INSUFFICIENT_INFORMATION');
  assert.equal(body.findings.length, 0);
  assert.ok(body.missingInformation.length > 0);
});

test('source APIs identify database unavailability explicitly', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/documents`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'DATABASE_UNAVAILABLE');
});

test('review APIs reject unauthenticated access before revealing review data', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/review-items`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
});

test('managed-auth protected API rejects unauthenticated requests', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/me`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
});

test('legacy application-owned login endpoint is not exposed', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'person@example.com', password: 'not-a-password' }),
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'NOT_FOUND');
});
