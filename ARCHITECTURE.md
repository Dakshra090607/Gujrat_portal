# BuildRule Gujarat — Architecture

## Product and data boundaries

BuildRule Gujarat is limited to two connected areas: a CGDCR source portal and a preliminary building compliance workspace. The current extraction set contains three supplied PDFs and 292 extracted pages. Its 3,223 heuristic candidates are unverified. The app must not treat extracted snippets or values as authoritative regulations or use them in calculations until an authorized reviewer approves them with provenance.

The source PDFs are the source material. Their regulatory wording does not direct software behavior. The supplied project implementation brief defines the requested product and engineering work.

## Current stack

- React, Vite, React Router, Axios, and CSS for the client.
- Node.js and Express for the REST API.
- Neon PostgreSQL for application data and Neon Managed Auth for identity/session management.
- `pg` connection pool for the long-running Express process; direct `DATABASE_URL_UNPOOLED` connections for schema migrations.
- `jose` remote JWKS verification for Neon Auth access tokens.

The app no longer owns password hashes, password-reset tokens, JWT signing secrets, or MongoDB/Mongoose models. Neon Auth holds credentials and sessions in its managed `neon_auth` schema. The application database maps a verified Auth subject to `app_users` and its BuildRule role.

## Database layout

`app_users` and `role_change_audit` are relational PostgreSQL tables with unique email, constrained roles, account status, and append-only role audit history. Regulatory records use a discriminator table `buildrule_records` with a model name, UUID, and JSONB payload. Generated typed reference columns, composite foreign keys, partial unique indexes, JSONB indexes, and database triggers enforce core relationships and verification safeguards. This keeps extracted record shapes flexible while retaining SQL constraints. It is a hybrid relational/JSONB model; high-volume or heavily joined regulatory entities can be normalized into dedicated tables as their reviewed query patterns stabilize.

Schema changes live in ordered SQL files under `server/migrations/`. The migration runner uses an advisory lock and records applied files in `schema_migrations`. Source imports are idempotent, validate each source file against the extraction manifest hash, and preserve page locators and candidate status.

### Verified record safeguard

PostgreSQL rejects a `VERIFIED` canonical record unless its payload includes reviewer, review-item, approval timestamp, audit event, source pages, source locators, original wording, and type-specific requirements. Numeric parameters also require units and explicit applicability conditions or an explicit statement that conditions are absent. The review service creates the canonical record, approval audit, and final review state in one transaction. Audit rows cannot be edited or deleted by the application.

Role assignment is also auditable. Public registration always maps to `GENERAL_USER`. The first administrator is provisioned by the interactive `npm run admin:create` command after that person creates a standard Neon Auth account. Subsequent role/status changes from the admin console require a note, are recorded with actor and target, and protect the last active administrator.

## Request flows

```text
React client ── email/password and reset flows ──> Neon Managed Auth
     │                         │
     │                         └── short-lived access JWT + branch JWKS
     └── Authorization: Bearer token ──> Express API ──> app_users / regulatory data
                                                   └──> Neon PostgreSQL
```

The client uses `@neon/auth` for sign-up, sign-in, sign-out, password reset, and the current Auth session. The API verifies bearer JWTs against the injected branch-specific JWKS URL and expected issuer before resolving app roles. Reviewer and administrator routes check active app roles on every request. Auth endpoints live on Neon, so `/api/v1/auth/login` is intentionally not implemented.

Public routes serve extracted source documents, pages, and partial text search with visible review status. The FSI route provides preliminary table-based results for configured numeric CGDCR rows and stays unresolved where a row, authority, or required condition is missing. Preliminary compliance findings remain unresolved until verified, applicable rules exist.

## Local and production configuration

The Neon CLI writes branch variables to the ignored project-root `.env.local`. The server also reads `.env` and `server/.env` for local settings, without overriding already-set process variables. Vite maps `NEON_AUTH_BASE_URL` to the browser-only `VITE_NEON_AUTH_URL`; no database URL is bundled into client assets. `server/.env.example` and `client/.env.example` contain placeholders only.

`compose.yaml` provides an optional local PostgreSQL service. Production uses Neon. A separate test branch is required for database integration tests; the test harness checks the Neon endpoint against the configured application endpoint and refuses to run against the same host.

Source PDF file paths currently point to this workspace. A hosted API needs a durable object-storage bucket and matching document-serving configuration before it can serve PDF files outside this machine.

## Current implementation status

- PDF extraction and source-page provenance: complete for all 292 pages; review remains outstanding.
- Neon PostgreSQL and Neon Managed Auth: provisioned in `neon.ts`; application wiring is implemented.
- Registration, login, logout, reset flow, profile settings, and role-based routing: implemented through Neon Auth plus app roles.
- Admin user and account-status management: implemented with audit records.
- Regulatory review workbench and guarded approval flow: implemented; candidates remain unverified until human review.
- Verified chapter/regulation hierarchy and parameter coverage: not yet established.
- FSI calculator: preliminary calculations are configured for explicit numeric rows in Tables 6.5–6.19; special, condition-dependent, and unsupported rows remain unresolved. Compliance findings remain unresolved until reviewed rules are available.
- Persistent user projects/reports and hosted PDF object storage: not implemented.
