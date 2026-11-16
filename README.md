# BuildRule Gujarat

BuildRule Gujarat is a source-linked workspace for the supplied CGDCR-2017 PDFs. It includes a React/Vite client, an Express API, Neon PostgreSQL, and Neon Managed Auth.

## Current data state

The extraction set contains three source PDFs and 292 page records. Its 3,223 extracted candidates remain `NEEDS_REVIEW`; no chapter, regulation, table, definition, or parameter is represented as verified. FSI and compliance outputs therefore remain unresolved. Source candidates cannot become verified records by changing a status field: approval requires a reviewer, source locator, typed data, applicability information where required, and an audit event.

## Requirements

- Node.js 20.19 or newer and npm
- Neon CLI (`npm i -g neon@latest`) and access to the configured Neon project
- The three PDFs and `data/extracted/` artifacts included in this workspace

The project root `.env.local` is ignored by Git and contains the branch-specific Neon database and Auth URLs. Never commit it or paste its contents into chat. The API uses `DATABASE_URL`; schema migrations use the direct `DATABASE_URL_UNPOOLED` connection. Vite receives only the public Auth URL and API URL.

## Install and initialize

Run from the project root:

```powershell
npm install
npm --prefix server install
npm --prefix client install
neon deploy
npm run db:migrate
npm run seed:source
npm run db:validate
```

`neon deploy` provisions the PostgreSQL and Neon Auth services already declared in `neon.ts` and updates the ignored `.env.local`. The migration is repeatable. The source seeder verifies each PDF SHA-256 against the extraction manifest and upserts page data; it does not approve regulatory candidates.

To create the review queue from extracted candidates, run `npm run review:backfill`. This operation is idempotent and writes queued review items; it does not change the extracted candidate status.

To enable question answering in Search, configure `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_AI_TOKEN` on the server (including the deployed Vercel server service), then run `npm run db:migrate`, `npm run seed:source`, and `npm run rag:index` against the application database. See [docs/RAG_SEARCH.md](docs/RAG_SEARCH.md) for model defaults, free-tier limits, and the retrieval/indexing details. The existing keyword search remains available as a fallback.

## Run locally

Start the API and browser app in separate PowerShell terminals from the project root.

Terminal 1:

```powershell
npm run dev:server
```

Terminal 2:

```powershell
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173). The API health endpoint is [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health).

## Login and administrator access

Register through `/register` or sign in through `/login`. Neon Managed Auth stores passwords and sessions; the app stores only the verified Neon identity, display name, role, and audit/profile data in PostgreSQL. Password recovery is handled by Neon Auth. Public registration always creates a `GENERAL_USER` profile.

To provision the first administrator:

1. Register and sign in with the email that should become the administrator.
2. In a trusted terminal, run `npm run admin:create`.
3. Enter that existing account email and type `PROMOTE` at the confirmation prompt.

The command records the grant in the append-only role audit. It never asks for or stores the account password. Reviewer and administrator users use the same standard login page. Admins can manage account roles and status from `/admin`; every role/status change requires an audit note.

Existing password hashes and sessions cannot be transferred into Neon Managed Auth. Each person must create a Neon Auth account. Promote the administrator account after registration using the CLI above.

## Checks

```powershell
npm test
npm run build
```

The isolated PostgreSQL workflow check uses a separate Neon branch. Set `TEST_DATABASE_URL` to that branch’s direct connection URL, then run `npm run test:integration`. The command validates that its endpoint differs from the configured application branch, applies migrations to the test branch, and inserts only fixture records there. It does not drop tables or records. Do not point it at production.

For routine service checks, use `npm run db:validate` and `GET /api/v1/health`. `npm run db:validate` reports source hashes, page coverage, candidate statuses, and partial text-search results.

## Neon Auth settings

The app uses Neon Auth email/password sign-up, sign-in, sign-out, and password reset through `@neon/auth`. Localhost is supported by the configured Auth service. Before deployment, add the real app origin to Neon Auth trusted domains and configure production SMTP for branded mail and email verification links. Do not enable public reviewer/admin registration.

## Storage and deployment

The source PDFs are preserved in this workspace and the seeded rows currently store their local file paths. A hosted API cannot read files from this Windows workspace; production deployment needs a durable object-storage location and corresponding file-serving configuration. No deployment is performed by these local setup commands.

## Project references

- [Architecture](ARCHITECTURE.md)
- [Implementation roadmap](IMPLEMENTATION-ROADMAP.md)
- [Extraction notes](docs/EXTRACTION.md)
- [Milestone 5A implementation brief](docs/MILESTONE-5A-IMPLEMENTATION-PROMPT.md)
