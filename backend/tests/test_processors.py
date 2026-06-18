import os
import tempfile
from app.processors import bill_parser, explanation_engine, dispute_generator


def test_parse_line_items_simple():
    raw_text = "Service charge    $12.00\nUsage fee    $45.50\nTotal    $57.50"
    items = bill_parser.parse_line_items(raw_text)
    assert len(items) == 2
    assert items[0]["description"] == "Service charge"
    assert items[1]["amount"] == 45.50


def test_find_total_amount():
    raw_text = "Some text\nTotal $123.45\nThank you"
    assert bill_parser.find_total_amount(raw_text) == 123.45


def test_enrich_bill_flags_suspicion():
    bill = {
        "line_items": [
            {"description": "Late payment fee", "amount": 15.0},
            {"description": "Monthly subscription", "amount": 80.0},
        ]
    }
    enriched = explanation_engine.enrich_bill(bill)
    assert enriched["suspicious_score"] > 0
    assert any(item["flags"] for item in enriched["line_items"])


def test_build_dispute_letter():
    bill_data = {
        "line_items": [
            {"description": "Late payment fee", "amount": 15.0, "flags": "Suspicious fee"},
        ]
    }
    letter = dispute_generator.build_dispute_letter(bill_data)
    assert "Late payment fee" in letter
    assert "Sincerely" in letter
