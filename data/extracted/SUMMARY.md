# CGDCR Extraction Run Summary

Generated: 2026-11-03T11:06:57.536466+00:00

> Page text extraction is complete for pages with selectable text. Heuristic candidates are unverified. This is not a complete verified regulation/table inventory.

## Coverage

| Part | PDF pages | Pages with text | Pages needing review | Table candidates | Candidate counts (heuristic) | Status |
|---|---:|---:|---:|---:|---|---|
| Part I | 166 | 166 | 0 | 61 on 54 pages | condition_or_exception_candidate: 45, cross_reference_candidate: 147, definition_candidate: 192, numbered_heading_or_clause_candidate: 505, numeric_parameter_candidate: 141, table_or_schedule_candidate: 144 | EXTRACTED |
| Part II | 76 | 76 | 0 | 83 on 48 pages | chapter_toc_candidate: 4, condition_or_exception_candidate: 81, cross_reference_candidate: 213, definition_candidate: 23, numbered_heading_or_clause_candidate: 221, numeric_parameter_candidate: 538, table_or_schedule_candidate: 221 | EXTRACTED |
| Part III | 50 | 50 | 0 | 17 on 14 pages | condition_or_exception_candidate: 28, cross_reference_candidate: 55, definition_candidate: 17, numbered_heading_or_clause_candidate: 253, numeric_parameter_candidate: 182, table_or_schedule_candidate: 52 | EXTRACTED |

Total pages: **292**; text extracted: **292**; pages needing review/OCR: **0**.

## Verified regulatory records and review queue

| Record type | Verified records | Automated candidates needing review |
|---|---:|---:|
| Parts | 0 verified structures | 3 source parts identified from supplied files |
| Chapters | 0 | 4 chapter heading candidates |
| Regulations/clauses | 0 | 979 numbered heading/clause snippets; not canonical regulation records |
| Tables | 0 | 161 extracted table candidates across 116 pages |
| Definitions | 0 | 232 wording candidates |
| Numerical parameters | 0 | 861 numeric snippets |
| Total heuristic review objects | — | 3223 (snippet matches can overlap categories) |

Extraction tools: pypdf 6.10.0 (text), pdfplumber 0.11.9 (table candidates).

All supplied source parts were identified, but canonical part/chapter/regulation records are not yet verified.

## Interpretation limits

- Candidate counts are pattern matches, not counts of verified chapters, regulations, tables, definitions, or numerical parameters.
- Printed page labels have not been aligned with PDF page numbers.
- Table candidate rows were extracted with pdfplumber, but cell boundaries, merged headers, units, footnotes, and conditions require rendered-page review.
- All candidates remain `NEEDS_REVIEW`; no extracted record is marked `VERIFIED`.
- OCR was not run because all pages passed the selectable-text threshold. Review rendering before deciding whether OCR is needed for any page content such as figures or scanned tables.

## Errors

No page extraction exceptions were raised in this run.
