# Source-grounded AI search

Search can answer questions using retrieved passages from the supplied CGDCR PDFs. Retrieval is semantic, and every answer includes links to the exact source PDF pages. Extracted passages and AI answers remain unverified; this feature does not replace a legal review or drive FSI/compliance calculations.

## Cloudflare Workers AI setup

Create a Cloudflare Workers AI account and API token with Workers AI permissions. Add these values to the server environment in Vercel and in the local `server/.env` when developing:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_AI_TOKEN`

The defaults are `@cf/baai/bge-m3` for multilingual embeddings and `@cf/zai-org/glm-4.7-flash` for answer generation. Optional overrides are `CLOUDFLARE_EMBEDDING_MODEL` and `CLOUDFLARE_CHAT_MODEL`.

Do not put Cloudflare credentials in any `VITE_` variable or client-side code. The API calls Cloudflare from the Express server.

## Prepare the vector index

Run these commands from the repository root against the database used by the deployed app:

```powershell
npm run db:migrate
npm run seed:source
npm run rag:index
```

The migration enables PostgreSQL `pgvector` and creates the passage index table. The indexer splits each extracted PDF page into overlapping passages, includes available heuristic table rows, creates embeddings in small batches, and stores passage text with its source document and PDF page. Re-run `npm run rag:index` after changing the extraction or embedding model. The indexer does not alter source records or mark any content verified.

The Cloudflare Workers AI Free plan has a daily Neurons allowance, so model requests can stop until the quota resets if that allowance is exhausted. The initial index contains only the current three source documents. Check the Cloudflare dashboard's Workers AI usage page before re-indexing repeatedly.

## Runtime behavior

`POST /api/v1/search/ask` embeds the question, retrieves the closest passages from PostgreSQL, and asks the answer model to respond only from those passages. The response includes `[S1]`-style citations and source metadata. If the semantic service is not configured or the index is missing, the Search page falls back to exact keyword search.

The answer prompt treats retrieved text as untrusted source material, requires passage citations, and instructs the model to say when the indexed text does not establish an answer. It also labels the answer and passages as unverified. Check each citation against the original PDF before relying on it.
