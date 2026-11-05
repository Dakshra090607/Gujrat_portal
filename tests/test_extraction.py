from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from ingest.extract_cgdcr import candidate_lines  # noqa: E402


class CandidateExtractionTests(unittest.TestCase):
    def test_candidate_keeps_exact_source_snippet_and_page(self) -> None:
        line = "6.3.1 Floor Space Index (F.S.I.) for different categories"
        candidates = candidate_lines(line, 42)
        clause = next(item for item in candidates if item["kind"] == "numbered_heading_or_clause_candidate")
        self.assertEqual(clause["sourceSnippet"], line)
        self.assertEqual(clause["sourceLocator"]["pdfPageNumber"], 42)
        self.assertEqual(clause["verificationStatus"], "NEEDS_REVIEW")

    def test_numeric_definition_and_condition_matches_remain_candidates(self) -> None:
        text = "The margin means 6.0 mts. provided that the road is not less than 9.0 mts."
        kinds = {item["kind"] for item in candidate_lines(text, 9)}
        self.assertIn("definition_candidate", kinds)
        self.assertIn("numeric_parameter_candidate", kinds)
        self.assertIn("condition_or_exception_candidate", kinds)

    def test_table_and_cross_reference_matches_remain_candidates(self) -> None:
        text = "See Table 6.5 and Regulation 6.3.1 for details."
        kinds = {item["kind"] for item in candidate_lines(text, 12)}
        self.assertIn("table_or_schedule_candidate", kinds)
        self.assertIn("cross_reference_candidate", kinds)


class ExtractionArtifactTests(unittest.TestCase):
    def test_all_current_candidates_have_review_status_and_page_links(self) -> None:
        data_dir = ROOT / "data" / "extracted"
        manifest = json.loads((data_dir / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["totals"]["pdfPages"], 292)
        for path in data_dir.glob("part-*.json"):
            document = json.loads(path.read_text(encoding="utf-8"))
            for page in document["pages"]:
                for candidate in page["candidates"] + page["tableCandidates"]:
                    self.assertEqual(candidate["verificationStatus"], "NEEDS_REVIEW")
                    self.assertEqual(candidate["sourceLocator"]["pdfPageNumber"], page["pdfPageNumber"])


if __name__ == "__main__":
    unittest.main()
