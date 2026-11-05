# BuildRule Gujarat — Implementation Roadmap

This roadmap separates extracted source material from verified regulatory records and features that may consume reviewed data. Milestone status describes the current code and data evidence, not future plans.

## Milestone 1 — Product architecture

**Status: Complete.** The app boundaries, source-provenance requirements, project architecture, and data-consumption gates are documented in [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Milestone 2 — Regulatory document extraction

**Status: Complete for page extraction; regulatory review remains outstanding.** The pipeline produced page-level JSON for 292/292 pages across three PDFs. The manifest records file hashes, extraction metadata, page counts, and candidate counts. It contains 3,223 heuristic candidates, all marked `NEEDS_REVIEW`; they are not counts of verified chapters, regulations, or parameters.

**Exit evidence:** [`docs/EXTRACTION.md`](docs/EXTRACTION.md), `data/extracted/`, and the extraction validation scripts.

## Milestone 3 — PostgreSQL and source ingestion

**Status: Implemented for Neon PostgreSQL.** Neon PostgreSQL and Managed Auth are declared in `neon.ts`. The server uses `pg`, ordered SQL migrations, constrained identity/audit tables, and indexed JSONB regulatory records. The source seed and validator are repeatable and check file hashes, pages, candidates, and search. The live database must pass `npm run db:validate` before its imported record counts are claimed.

## Milestone 4 — Application foundation

**Status: Implemented.** React/Vite and Express provide source browsing, API health, security headers, public search, and database-backed routes. Root scripts provide `npm run build`, `npm test`, and local client/server start commands.

## Milestone 5 — CGDCR information portal

**Status: Partial.** Source document browsing, source-page reading, original PDF links, and partial text search are implemented. Structured hierarchy browsing and category search wait for manual review and verified records.

## Milestone 5A — Regulatory review and verification

**Status: Implemented; data review remains in progress.** The admin/reviewer workbench, candidate queue API, typed drafts, source-page checks, transactional approval, immutable audit history, and schema-level promotion safeguards are implemented. The queue can be populated with `npm run review:backfill`. No extracted candidate is automatically promoted.

The initial administrator is created after signing up through the normal Neon Auth page, using the interactive `npm run admin:create` CLI. Account roles and active status can then be managed from the admin console with required audit notes. Database workflow integration checks require a separate Neon branch.

## Milestone 6 — Regulation search

**Status: Partial.** Case-insensitive substring search over extracted page text, part filtering, snippets, pagination, and PDF page navigation are available. Structured regulation search awaits verified hierarchy records.

## Milestone 7 — FSI calculator

**Status: Data-gated.** The input form and API are implemented. The API returns an unresolved result until the applicable parameter, conditions, units, and source evidence have been verified.

## Milestone 8 — Preliminary compliance checker

**Status: Data-gated.** Project inputs and an insufficient-information response are implemented. No compliance finding is asserted without a verified applicable rule.

## Milestone 9 — Development permission guide

**Status: Data-gated.** The current UI explicitly reports that source-mapped procedure stages are pending review.

## Milestone 10 — Project history and reports

**Status: Planned.** Add persistent project inputs, calculation/assessment history, and source-referenced reports after the verified rule data supports meaningful results.

## Milestone 11 — Release readiness

**Status: Planned.** Validate production Auth trusted domains and SMTP, hosted PDF storage, accessibility, security, and release configuration before deployment.

## Data-consumption gates

- Preserve the exact source document/version and one-based PDF page locator for every rule and value.
- Keep original wording separate from explanations.
- Preserve applicability conditions, exceptions, units, and review status.
- Return unresolved results when source data or applicability is incomplete.
- Ensure every verified record has reviewer identity, decision, timestamp, source references, and audit history.
