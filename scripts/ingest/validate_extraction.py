#!/usr/bin/env python3
"""Validate generated extraction artifacts against source files and provenance rules."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from ingest.extract_cgdcr import EXPECTED, sha256_file  # noqa: E402


def main() -> int:
    output_dir = ROOT / "data" / "extracted"
    manifest_path = output_dir / "manifest.json"
    if not manifest_path.is_file():
        print("Missing data/extracted/manifest.json", file=sys.stderr)
        return 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    failures: list[str] = []
    if len(manifest.get("documents", [])) != len(EXPECTED):
        failures.append("manifest must contain exactly the three expected source PDFs")

    total_pages = 0
    total_text_pages = 0
    for filename, identity in EXPECTED.items():
        slug = identity["part"].lower().replace(" ", "-")
        source_path = ROOT / filename
        data_path = output_dir / f"{slug}.json"
        if not source_path.is_file() or not data_path.is_file():
            failures.append(f"missing source or extraction output for {filename}")
            continue
        data = json.loads(data_path.read_text(encoding="utf-8"))
        source = data["sourceDocument"]
        pages = data["pages"]
        if source["sha256"] != sha256_file(source_path):
            failures.append(f"source hash mismatch for {filename}")
        if source["filename"] != filename or source["part"] != identity["part"]:
            failures.append(f"source identity mismatch for {filename}")
        if source["pdfPageCount"] != len(pages):
            failures.append(f"page count mismatch for {filename}")
        if [p["pdfPageNumber"] for p in pages] != list(range(1, len(pages) + 1)):
            failures.append(f"PDF page locators are not contiguous and one-based for {filename}")
        for page in pages:
            if page["textExtractionStatus"] == "EXTRACTED" and len(page["text"].strip()) < 40:
                failures.append(f"page {page['pdfPageNumber']} marked extracted with insufficient text in {filename}")
            for candidate in page["candidates"] + page["tableCandidates"]:
                if candidate.get("verificationStatus") != "NEEDS_REVIEW":
                    failures.append(f"candidate was promoted from review status in {filename}")
                if candidate.get("sourceLocator", {}).get("pdfPageNumber") != page["pdfPageNumber"]:
                    failures.append(f"candidate page locator mismatch in {filename}")
        if data["extraction"]["textPages"] != sum(p["textExtractionStatus"] == "EXTRACTED" for p in pages):
            failures.append(f"text page count mismatch in {filename}")
        total_pages += len(pages)
        total_text_pages += data["extraction"]["textPages"]

    if manifest.get("totals", {}).get("pdfPages") != total_pages:
        failures.append("manifest total page count does not match extracted documents")
    if manifest.get("totals", {}).get("textPages") != total_text_pages:
        failures.append("manifest total text page count does not match extracted documents")

    if failures:
        print("Extraction validation FAILED:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"Extraction validation passed: {len(EXPECTED)} documents, {total_pages} pages, {total_text_pages} pages with selectable text.")
    print("All heuristic regulation/table candidates remain NEEDS_REVIEW and page-linked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
