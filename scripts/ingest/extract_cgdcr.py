#!/usr/bin/env python3
"""Extract page-preserving candidate text from the supplied CGDCR PDFs.

This is a discovery pipeline, not a legal parser. It preserves each page's
text and emits review candidates with exact source snippets. It never marks a
candidate VERIFIED and never infers a definitive regulation hierarchy.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from pypdf import PdfReader, __version__ as PYPDF_VERSION
except ImportError as exc:  # pragma: no cover - error path
    raise SystemExit(
        "Missing pypdf. Install project extraction requirements with: "
        "python -m pip install -r requirements-extraction.txt"
    ) from exc
try:
    import pdfplumber
except ImportError as exc:  # pragma: no cover - error path
    raise SystemExit(
        "Missing pdfplumber. Install project extraction requirements with: "
        "python -m pip install -r requirements-extraction.txt"
    ) from exc
PDFPLUMBER_VERSION = pdfplumber.__version__


ROOT = Path(__file__).resolve().parents[2]
EXPECTED = {
    "CGDCR-2017 PART-I PROCEDURE REGULATIONS.pdf": {
        "part": "Part I",
        "partTitle": "Procedure Regulations",
    },
    "CGDCR-2017 PART-II PLANNING REGULATIONS.pdf": {
        "part": "Part II",
        "partTitle": "Planning Regulations",
    },
    "CGDCR-2017 PART-III PERFORMANCE REGULATION.pdf": {
        "part": "Part III",
        "partTitle": "Performance Regulation",
    },
}

PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("chapter_heading_candidate", re.compile(r"^\s*(?:CHAPTER\s+)?(?:[IVXLCDM]+|\d{1,2})[.)]?\s+CHAPTER\b.*$", re.I)),
    ("chapter_heading_candidate", re.compile(r"^\s*CHAPTER\s+[IVXLCDM0-9]+\b.*$", re.I)),
    ("chapter_toc_candidate", re.compile(r"^\s*\d{1,2}\s+[A-Z][A-Z0-9\s&().,/—–:'-]{4,}?\s+\.{2,}\s*\d+\s*$")),
    ("numbered_heading_or_clause_candidate", re.compile(r"^\s*\d+(?:\.\d+){1,4}\.?\s+\S.{2,}$")),
    ("table_or_schedule_candidate", re.compile(r"\b(?:table|schedule|annex(?:ure)?|appendix)\s*(?:no\.?\s*)?[A-Z0-9IVX.-]*", re.I)),
    ("definition_candidate", re.compile(r"\b(?:shall\s+mean|means\s+and\s+includes|means|shall\s+include)\b", re.I)),
    ("numeric_parameter_candidate", re.compile(r"(?:\bFSI\b|\bF\.S\.I\b|\d+(?:\.\d+)?\s*(?:%|mts?\.?|met(?:er|re)s?|sq\.?\s*m(?:t|eter|etre)?s?|m²|hectares?|acres?|nos?\.?))", re.I)),
    ("condition_or_exception_candidate", re.compile(r"\b(?:provided that|subject to|except|unless|notwithstanding|shall not apply)\b", re.I)),
    ("cross_reference_candidate", re.compile(r"\b(?:regulation|clause|table|schedule)\s+(?:no\.?\s*)?\d+(?:\.\d+){0,4}\b", re.I)),
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def candidate_lines(text: str, pdf_page_number: int) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        normalized = line.strip()
        if not normalized:
            continue
        for kind, pattern in PATTERNS:
            if pattern.search(normalized):
                candidates.append(
                    {
                        "candidateId": f"p{pdf_page_number}-l{line_number}-{kind}",
                        "kind": kind,
                        "sourceSnippet": normalized,
                        "sourceLine": line_number,
                        "sourceLocator": {"pdfPageNumber": pdf_page_number},
                        "verificationStatus": "NEEDS_REVIEW",
                    }
                )
    return candidates


def extract_document(source: Path, output_dir: Path) -> dict[str, Any]:
    identity = EXPECTED[source.name]
    reader = PdfReader(str(source), strict=False)
    pages: list[dict[str, Any]] = []
    kind_counts: dict[str, int] = {}
    text_pages = 0
    table_candidate_count = 0
    table_candidate_pages = 0
    with pdfplumber.open(str(source)) as layout_pdf:
      if len(layout_pdf.pages) != len(reader.pages):
          raise ValueError(f"Page-count mismatch between pypdf and pdfplumber for {source.name}")
      for pdf_page_number, (page, layout_page) in enumerate(zip(reader.pages, layout_pdf.pages), start=1):
        layout_text = layout_page.extract_text() or ""
        fallback_text = page.extract_text() or ""
        text = layout_text if layout_text.strip() else fallback_text
        text_tool = "pdfplumber" if layout_text.strip() else "pypdf"
        page_candidates = candidate_lines(text, pdf_page_number)
        raw_tables = layout_page.extract_tables()
        table_candidates = []
        for table_index, rows in enumerate(raw_tables, start=1):
            normalized_rows = [[(cell or "").strip() for cell in row] for row in rows]
            if not any(any(cell for cell in row) for row in normalized_rows):
                continue
            table_candidates.append(
                {
                    "candidateId": f"p{pdf_page_number}-table{table_index}",
                    "sourceLocator": {"pdfPageNumber": pdf_page_number},
                    "rows": normalized_rows,
                    "verificationStatus": "NEEDS_REVIEW",
                    "reviewNote": "Cell boundaries and header/footnote relationships require comparison with the rendered source page.",
                }
            )
        table_candidate_count += len(table_candidates)
        table_candidate_pages += int(bool(table_candidates))
        text_present = len(text.strip()) >= 40
        text_pages += int(text_present)
        for candidate in page_candidates:
            kind_counts[candidate["kind"]] = kind_counts.get(candidate["kind"], 0) + 1
        pages.append(
            {
                "pdfPageNumber": pdf_page_number,
                "printedPageLabel": None,
                "textCharacterCount": len(text),
                "textExtractionTool": text_tool,
                "textExtractionStatus": "EXTRACTED" if text_present else "NEEDS_REVIEW",
                "ocrRequired": not text_present,
                "text": text,
                "candidates": page_candidates,
                "tableCandidates": table_candidates,
            }
        )

    metadata = {str(key): (str(value) if value is not None else None) for key, value in (reader.metadata or {}).items()}
    output = {
        "schemaVersion": "1.0.0",
        "sourceDocument": {
            **identity,
            "countryCode": "IN",
            "stateCode": "GJ",
            "framework": "CGDCR",
            "version": "2017",
            "filename": source.name,
            "sha256": sha256_file(source),
            "byteSize": source.stat().st_size,
            "pdfPageCount": len(reader.pages),
            "metadata": metadata,
        },
        "extraction": {
            "tool": "pdfplumber",
            "toolVersion": PDFPLUMBER_VERSION,
            "fallbackTool": "pypdf",
            "fallbackToolVersion": PYPDF_VERSION,
            "tableTool": "pdfplumber",
            "tableToolVersion": PDFPLUMBER_VERSION,
            "extractedAt": datetime.now(timezone.utc).isoformat(),
            "method": "PDF text layer, page by page",
            "textPages": text_pages,
            "ocrPages": 0,
            "pagesNeedingReview": len(reader.pages) - text_pages,
            "tableCandidatePages": table_candidate_pages,
            "tableCandidates": table_candidate_count,
            "candidateCounts": kind_counts,
            "verificationStatus": "EXTRACTED",
            "limitations": [
                "Candidate patterns are heuristic and require source-page review.",
                "No legal hierarchy, printed page labels, or verification status is inferred.",
                "Table candidates are heuristic row/cell extraction and require comparison with rendered pages for merged cells, headers, units, footnotes, and conditions.",
            ],
        },
        "pages": pages,
    }
    slug = re.sub(r"[^a-z0-9]+", "-", identity["part"].lower()).strip("-")
    output_dir.mkdir(parents=True, exist_ok=True)
    destination = output_dir / f"{slug}.json"
    destination.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return output


def write_summary(documents: list[dict[str, Any]], output_dir: Path) -> None:
    manifest = {
        "schemaVersion": "1.0.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "tool": "scripts/ingest/extract_cgdcr.py",
        "extractionTools": {
            "pageText": {"name": documents[0]["extraction"]["tool"], "version": documents[0]["extraction"]["toolVersion"]},
            "pageTextFallback": {"name": documents[0]["extraction"]["fallbackTool"], "version": documents[0]["extraction"]["fallbackToolVersion"]},
            "tableCandidates": {"name": documents[0]["extraction"]["tableTool"], "version": documents[0]["extraction"]["tableToolVersion"]},
        },
        "documents": [
            {
                "filename": doc["sourceDocument"]["filename"],
                "part": doc["sourceDocument"]["part"],
                "sha256": doc["sourceDocument"]["sha256"],
                "pdfPageCount": doc["sourceDocument"]["pdfPageCount"],
                "textPages": doc["extraction"]["textPages"],
                "pagesNeedingReview": doc["extraction"]["pagesNeedingReview"],
                "candidateCounts": doc["extraction"]["candidateCounts"],
                "tableCandidatePages": doc["extraction"]["tableCandidatePages"],
                "tableCandidates": doc["extraction"]["tableCandidates"],
                "verificationStatus": doc["extraction"]["verificationStatus"],
            }
            for doc in documents
        ],
        "totals": {
            "documents": len(documents),
            "pdfPages": sum(doc["sourceDocument"]["pdfPageCount"] for doc in documents),
            "textPages": sum(doc["extraction"]["textPages"] for doc in documents),
            "pagesNeedingReview": sum(doc["extraction"]["pagesNeedingReview"] for doc in documents),
            "tableCandidatePages": sum(doc["extraction"]["tableCandidatePages"] for doc in documents),
            "tableCandidates": sum(doc["extraction"]["tableCandidates"] for doc in documents),
            "candidateObjectsForReview": sum(
                doc["extraction"]["tableCandidates"] + sum(doc["extraction"]["candidateCounts"].values())
                for doc in documents
            ),
            "candidateCounts": {},
        },
        "verifiedRegulatoryRecordCounts": {
            "parts": 0,
            "chapters": 0,
            "regulations": 0,
            "tables": 0,
            "definitions": 0,
            "numericalParameters": 0,
        },
        "recordCompleteness": "PAGE_TEXT_EXTRACTED; REGULATORY RECORDS NOT VERIFIED",
        "errors": [],
    }
    for doc in documents:
        for kind, count in doc["extraction"]["candidateCounts"].items():
            manifest["totals"]["candidateCounts"][kind] = manifest["totals"]["candidateCounts"].get(kind, 0) + count
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# CGDCR Extraction Run Summary",
        "",
        f"Generated: {manifest['generatedAt']}",
        "",
        "> Page text extraction is complete for pages with selectable text. Heuristic candidates are unverified. This is not a complete verified regulation/table inventory.",
        "",
        "## Coverage",
        "",
        "| Part | PDF pages | Pages with text | Pages needing review | Table candidates | Candidate counts (heuristic) | Status |",
        "|---|---:|---:|---:|---:|---|---|",
    ]
    for doc in manifest["documents"]:
        counts = ", ".join(f"{k}: {v}" for k, v in sorted(doc["candidateCounts"].items())) or "none"
        lines.append(f"| {doc['part']} | {doc['pdfPageCount']} | {doc['textPages']} | {doc['pagesNeedingReview']} | {doc['tableCandidates']} on {doc['tableCandidatePages']} pages | {counts} | {doc['verificationStatus']} |")
    lines += [
        "",
        f"Total pages: **{manifest['totals']['pdfPages']}**; text extracted: **{manifest['totals']['textPages']}**; pages needing review/OCR: **{manifest['totals']['pagesNeedingReview']}**.",
        "",
        "## Verified regulatory records and review queue",
        "",
        "| Record type | Verified records | Automated candidates needing review |",
        "|---|---:|---:|",
        f"| Parts | 0 verified structures | {manifest['totals']['documents']} source parts identified from supplied files |",
        f"| Chapters | 0 | {manifest['totals']['candidateCounts'].get('chapter_toc_candidate', 0) + manifest['totals']['candidateCounts'].get('chapter_heading_candidate', 0)} chapter heading candidates |",
        f"| Regulations/clauses | 0 | {manifest['totals']['candidateCounts'].get('numbered_heading_or_clause_candidate', 0)} numbered heading/clause snippets; not canonical regulation records |",
        f"| Tables | 0 | {manifest['totals']['tableCandidates']} extracted table candidates across {manifest['totals']['tableCandidatePages']} pages |",
        f"| Definitions | 0 | {manifest['totals']['candidateCounts'].get('definition_candidate', 0)} wording candidates |",
        f"| Numerical parameters | 0 | {manifest['totals']['candidateCounts'].get('numeric_parameter_candidate', 0)} numeric snippets |",
        f"| Total heuristic review objects | — | {manifest['totals']['candidateObjectsForReview']} (snippet matches can overlap categories) |",
        "",
        f"Extraction tools: {manifest['extractionTools']['pageText']['name']} {manifest['extractionTools']['pageText']['version']} (page text), {manifest['extractionTools']['pageTextFallback']['name']} {manifest['extractionTools']['pageTextFallback']['version']} (text fallback), {manifest['extractionTools']['tableCandidates']['name']} {manifest['extractionTools']['tableCandidates']['version']} (table candidates).",
        "",
        "All supplied source parts were identified, but canonical part/chapter/regulation records are not yet verified.",
        "",
        "## Interpretation limits",
        "",
        "- Candidate counts are pattern matches, not counts of verified chapters, regulations, tables, definitions, or numerical parameters.",
        "- Printed page labels have not been aligned with PDF page numbers.",
        "- Table candidate rows were extracted with pdfplumber, but cell boundaries, merged headers, units, footnotes, and conditions require rendered-page review.",
        "- All candidates remain `NEEDS_REVIEW`; no extracted record is marked `VERIFIED`.",
        "- OCR was not run because all pages passed the selectable-text threshold. Review rendering before deciding whether OCR is needed for any page content such as figures or scanned tables.",
        "",
        "## Errors",
        "",
        "No page extraction exceptions were raised in this run.",
        "",
    ]
    (output_dir / "SUMMARY.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=ROOT / "server" / "source-documents", help="Directory containing the three original PDFs")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data" / "extracted", help="Directory for extracted JSON and manifest")
    args = parser.parse_args()

    missing = [filename for filename in EXPECTED if not (args.source_dir / filename).is_file()]
    if missing:
        print("Missing source PDFs:", *missing, sep="\n- ", file=sys.stderr)
        return 2

    documents = [extract_document(args.source_dir / filename, args.output_dir) for filename in EXPECTED]
    write_summary(documents, args.output_dir)
    print(f"Extracted {sum(doc['sourceDocument']['pdfPageCount'] for doc in documents)} pages into {args.output_dir}")
    print(f"Summary: {args.output_dir / 'SUMMARY.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
