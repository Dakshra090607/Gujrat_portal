import test from 'node:test';
import assert from 'node:assert/strict';
import { assertIsolatedTestDatabase } from '../src/config/database.js';

const production = 'postgresql://app:secret@ep-production.us-east-2.aws.neon.tech/neondb?sslmode=require';
const isolated = 'postgresql://app:secret@ep-test-branch.us-east-2.aws.neon.tech/neondb?sslmode=require';

test('database integration target must be a distinct Neon endpoint', () => {
  assert.throws(() => assertIsolatedTestDatabase(undefined, production), /TEST_DATABASE_URL must point/);
  assert.throws(() => assertIsolatedTestDatabase('http://localhost/db_test', production), /must use PostgreSQL/);
  assert.throws(() => assertIsolatedTestDatabase('postgresql://app@localhost/db_test', production), /isolated Neon branch/);
  assert.throws(() => assertIsolatedTestDatabase(production, production), /application database endpoint/);
  assert.doesNotThrow(() => assertIsolatedTestDatabase(isolated, production));
});
