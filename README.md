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

## Repository structure and code map

This repository is the BuildRule Gujarat application. The browser client, API, source PDFs, extraction artifacts, and database scripts are organized as follows:

```text
.
├── api/
│   └── index.js                    # Serverless API entry point
├── client/
│   ├── public/                     # Static browser assets
│   ├── src/
│   │   ├── App.jsx                 # Client routes and page composition
│   │   ├── main.jsx                # React application entry point
│   │   ├── data/                   # Client-side authority and schedule data
│   │   ├── features/
│   │   │   ├── admin/              # Admin console and calculator configuration panels
│   │   │   ├── auth/               # Authentication and profile views
│   │   │   └── review/             # Regulation review workbench
│   │   ├── lib/                    # API client and authentication helpers
│   │   └── styles.css              # Shared application styles
│   ├── .env.example                # Public client config placeholders
│   ├── index.html                  # Browser HTML entry point
│   └── vite.config.js              # Vite configuration
├── data/
│   └── extracted/                  # PDF extraction output and manifest
├── docs/                           # Architecture, extraction, search, and project briefs
├── scripts/
│   └── ingest/                     # PDF extraction and validation tools
├── server/
│   ├── data/                       # Rule schedule and authority source data
│   ├── migrations/                 # Ordered PostgreSQL schema migrations
│   ├── scripts/                    # Migration, source seeding, indexing, and admin commands
│   ├── source-documents/           # Original CGDCR PDF files
│   ├── src/
│   │   ├── app.js                  # Express app and API middleware
│   │   ├── server.js               # HTTP server startup
│   │   ├── config/                 # Environment and database configuration
│   │   ├── db/                     # PostgreSQL model-store helpers
│   │   ├── models/                 # Data model registration
│   │   └── modules/                # Auth, search, documents, compliance, review, and admin APIs
│   ├── test/                       # Unit, safety, and integration tests
│   └── .env.example                # Server environment placeholders
├── tests/                          # Extraction pipeline tests
├── compose.yaml                    # Optional local PostgreSQL service
├── neon.ts                         # Neon project and Auth provisioning configuration
├── package.json                    # Root workspaces and common commands
└── README.md                       # Setup, data state, and repository guide
```

### Main files by responsibility

**Application and routing**

- `client/src/App.jsx` defines the browser routes and connects them to feature pages.
- `client/src/main.jsx` mounts the React application and shared providers.
- `client/src/lib/api.js` configures requests from the browser to the API; `client/src/lib/auth.js` handles client authentication helpers.
- `server/src/app.js` creates the Express application, middleware, and API routes. `server/src/server.js` starts the local HTTP listener.
- `api/index.js` adapts the Express API for the serverless deployment entry point.

**CGDCR rules and calculations**

- `server/src/modules/compliance/` contains the FSI calculation endpoint and its calculation logic.
- `server/data/` contains configured authorities, FSI schedules, margin schedules, and height/use/zone reference data.
- `client/src/data/` contains client-facing authority and table data used by calculator controls and views.
- `client/src/features/admin/Calculator*.jsx` provides administrator panels for maintaining calculator authorities, schedules, road widths, tables, use codes, and zones. `TallBuildingPolicyPanel.jsx` manages tall-building policy configuration.
- The calculator uses configured rule data and returns unresolved results when necessary rules or applicability details have not been verified; extracted text alone is not treated as an approved rule.

**Regulation documents and search**

- `server/source-documents/` stores the three original CGDCR PDFs.
- `server/src/modules/documents/routes.js` serves source-document endpoints.
- `server/src/modules/regulations/routes.js` provides regulation/source-text endpoints.
- `server/src/modules/search/routes.js` implements keyword and question search routes; `cloudflare-ai.js` contains the optional Cloudflare AI integration.
- `client/src/features/review/ReviewWorkbench.jsx` is the source review interface. Search results and review records retain their source information so users can verify passages against the PDFs.
- `data/extracted/` stores page-level extraction artifacts and the source manifest. `scripts/ingest/extract_cgdcr.py` extracts text; `validate_extraction.py` checks the extraction output.

**Administration, accounts, and database**

- `client/src/features/admin/AdminDashboard.jsx` composes the admin console; adjacent panels expose account and calculator configuration tools.
- `server/src/modules/admin/` contains admin API routes and server-side calculator configuration handlers.
- `server/src/modules/auth/` verifies identity and applies API authentication; `server/src/modules/users/routes.js` contains user-related API operations.
- `server/src/config/` loads environment and database configuration. `server/src/db/model-store.js` provides database-backed model operations.
- `server/migrations/001_postgres_core.sql` creates the PostgreSQL core schema; `002_rag_search.sql` adds retrieval/search storage.
- `server/scripts/` includes `migrate.js`, `seed-source-documents.js`, `validate-database.js`, `index-rag.js`, and `admin-create.js` for setup and maintenance workflows.

### How the pieces work together

The React client sends authenticated requests to the Express API. Neon Managed Auth handles sign-in and session tokens; the server verifies tokens and loads application roles from PostgreSQL. Search endpoints retrieve source passages and attach their document/page provenance. The calculator reads configured authority and schedule data and returns preliminary results only where applicable source-backed inputs exist. The admin console manages users, review workflows, and calculator configuration through protected API routes. SQL migrations and source seeding are explicit server-side commands rather than browser operations.

The three CGDCR PDFs are source material, not software instructions. Their extracted candidates remain unverified until reviewed with citations and audit records. Follow the existing verification safeguards described in [Architecture](ARCHITECTURE.md) before treating regulatory values as authoritative.

### Environment file guide

- Root `.env.local`: local Neon branch and Auth configuration; ignored by Git.
- `server/.env`: server-only database, Auth verification, and optional Cloudflare settings; copy from `server/.env.example` and keep it out of Git.
- `client/.env`: browser-safe Vite settings only; copy from `client/.env.example`. Do not put database credentials or private Cloudflare tokens in client variables because Vite embeds `VITE_*` values in browser assets.

The `.env.example` files contain placeholders and explain the expected keys. Never copy real credentials into README files, source code, commits, or client builds.
