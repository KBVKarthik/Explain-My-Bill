from typing import Dict, List

SUSPICIOUS_KEYWORDS = ["service charge", "late fee", "processing fee", "administrative fee", "minimum charge"]
UNCLEAR_TERMS = ["miscellaneous", "other", "adjustment", "fee", "charge"]


def explain_line_item(item: Dict) -> Dict:
    description = item["description"]
    amount = item["amount"]
    explanation = f"This item is billed as '{description}' for ${amount:.2f}."
    flags = []
    suspicious_note = ""

    lowered = description.lower()
    if any(keyword in lowered for keyword in SUSPICIOUS_KEYWORDS):
        suspicious_note = "This charge may be unusual or discretionary."
        flags.append("Suspicious fee")
    if any(term in lowered for term in UNCLEAR_TERMS) and not any(keyword in lowered for keyword in SUSPICIOUS_KEYWORDS):
        flags.append("Unclear term")
        explanation += " The description is vague and may need clarification."

    if amount < 0:
        explanation += " This is a credit or refund line."
    elif amount == 0:
        explanation += " This line appears to be a zero-dollar adjustment."

    if not suspicious_note and amount > 500:
        suspicious_note = "This is a high-value line item and may need review."
        flags.append("High value")

    item["explanation"] = explanation
    item["suspicious"] = suspicious_note
    item["flags"] = ", ".join(flags)
    return item


def score_suspicion(line_items: List[Dict]) -> float:
    score = 0.0
    for item in line_items:
        if item["suspicious"]:
            score += 0.4
        if "Unclear term" in item.get("flags", ""):
            score += 0.2
        if "High value" in item.get("flags", ""):
            score += 0.3
        if item["amount"] > 1000:
            score += 0.2
    return min(score, 1.0)


def summarize_bill(line_items: List[Dict]) -> str:
    total = sum(item["amount"] for item in line_items)
    suspicious = [item for item in line_items if item.get("suspicious") or item.get("flags")]
    summary = f"Your bill has {len(line_items)} line items totaling ${total:.2f}."
    if suspicious:
        summary += f" {len(suspicious)} item(s) look unusual or need clarification."
    else:
        summary += " Most items appear straightforward."
    return summary


def enrich_bill(bill_data: Dict):
    enriched_items = [explain_line_item(item) for item in bill_data["line_items"]]
    bill_data["line_items"] = enriched_items
    bill_data["suspicious_score"] = score_suspicion(enriched_items)
    bill_data["summary"] = summarize_bill(enriched_items)
    return bill_data
