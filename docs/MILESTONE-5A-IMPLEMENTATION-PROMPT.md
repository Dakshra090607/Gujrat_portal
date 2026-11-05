# Milestone 5A — Regulatory review and account access

## Objective

Make extracted regulatory candidates reviewable against their source pages and prevent incomplete or unreviewed records from becoming calculation inputs. Provide a standard account system for general users and an auditable administrator/reviewer workflow.

## Data and verification rules

- Keep source document, PDF page, printed page label, extraction snapshot, candidate path, and original text attached to each review item.
- A review item moves through queued, in-review, returned, rejected, or approved states. Every decision records reviewer, timestamp, note, and changed fields.
- Do not permit status-only promotion. The canonical record and approval audit must be written in the same PostgreSQL transaction.
- Verification requires a valid source locator and source page, original wording or typed source-backed data, required units, explicit applicability conditions, reviewer identity, and audit provenance.
- Preserve original numbering and wording. Do not invent parent hierarchy, applicability, exceptions, or numerical values.
- Database triggers enforce append-only audit rows and required evidence for `VERIFIED` records.

## Authentication and roles

- Use Neon Managed Auth through `@neon/auth` for email/password registration, sign-in, sign-out, session restoration, and password recovery. Do not add an application-owned password table, bcrypt flow, or JWT signing secret.
- Public registration always creates a `GENERAL_USER` role in the BuildRule profile table.
- Support the application roles `GENERAL_USER`, `PROFESSIONAL_USER`, `REVIEWER`, and `ADMIN`.
- Protect review APIs with active reviewer/admin roles and admin APIs with `ADMIN`.
- Provide profile name settings and password changes through Neon Auth. Keep email changes disabled unless a verified Neon Auth flow is implemented.
- Create the first admin through a trusted interactive CLI after a normal account is registered. Never seed a plaintext password or create a public privileged-registration path.
- Admin user and account-status changes require a reason, actor, timestamp, and append-only audit event. Prevent an administrator from disabling or demoting themselves and prevent removal of the last active admin.

## PostgreSQL integration

- Keep branch-specific URLs in ignored `.env.local`; do not expose database URLs to Vite.
- Use pooled `DATABASE_URL` for Express and direct `DATABASE_URL_UNPOOLED` for ordered migrations.
- Validate the data schema and the review transaction on a separate Neon branch. Integration checks must fail if that endpoint matches the app endpoint and must not drop application data.
- Seed only extracted source material from the manifest-verified PDFs. Keep all candidates in review-only state.

## Verification checklist

- `npm run build` succeeds.
- `npm test` covers the API envelopes, role defaults, and verification safeguards.
- A disposable-branch integration check confirms PostgreSQL connection, source-row read/write, transactional review approval, and rejection of unreviewed verification and audit edits.
- Exercise sign-up, sign-in, sign-out, reload session restoration, wrong-password feedback, password recovery, and protected reviewer/admin access against the configured Neon Auth branch before release.
- Report any step that depends on provider configuration or a human-supplied account.
