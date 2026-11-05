# CGDCR extraction pipeline

## Current source handling

The three original source PDFs are in the workspace root and remain unchanged. The extraction script validates that the expected files exist and records each SHA-256 before producing page-level JSON under `data/extracted/`.

## Run

Install the extractor dependency, then run:

```powershell
python -m pip install -r requirements-extraction.txt
python scripts/ingest/extract_cgdcr.py
```

Use `--source-dir` and `--output-dir` to select other paths. Output is repeatable except for the generated timestamp. Each page retains its one-based PDF page number, exact extracted text, character count, extraction status, and source snippets that matched discovery patterns. Printed-page labels are left unset until reviewed against the rendered page.

## Output and review contract

- `part-i.json`, `part-ii.json`, `part-iii.json`: source identity, metadata, hash, extraction metadata, per-page text/snippet candidates, and heuristic table rows from pdfplumber.
- `manifest.json`: document/page totals, hashes, candidate counts and statuses.
- `SUMMARY.md`: human-readable coverage report and limitations.
- Candidate snippets and table rows are heuristic discovery aids, not a verified hierarchy. Every candidate is `NEEDS_REVIEW`.
- Empty/low-text pages are marked `NEEDS_REVIEW` and `ocrRequired: true`; no OCR is falsely claimed.
- Do not use these candidates as calculator input. Only manually reviewed, properly structured, source-linked `VERIFIED` regulatory parameters can drive definitive calculations.

The current extractor uses pypdf for page text and pdfplumber for heuristic table rows. It does not infer merged cells or reliably associate footnotes, conditions, and multi-page continuation tables. Table candidates must be checked against rendered pages and corrected into structured cells with headers, units, footnotes, conditions, and PDF/printed page mapping before verification.
