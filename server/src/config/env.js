import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(directory, '../../..');

// Neon CLI writes branch variables at the project root. Load those first so
// server/.env can keep non-Neon local settings without hiding the Neon values.
// Tests opt out so a repository-local production URL cannot be selected by
// accident; integration tests must explicitly provide TEST_DATABASE_URL.
if (process.env.BUILDRULE_SKIP_DOTENV !== '1') {
  dotenv.config({ path: path.join(projectRoot, '.env.local'), override: false });
  dotenv.config({ path: path.join(projectRoot, '.env'), override: false });
  // A user-provided Neon CLI export may be named `env` without a dot prefix.
  dotenv.config({ path: path.join(projectRoot, 'env'), override: false });
  dotenv.config({ path: path.join(projectRoot, 'server', '.env'), override: false });
}
