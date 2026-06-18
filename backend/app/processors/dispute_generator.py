from typing import Dict, List


def build_dispute_letter(bill_data: Dict, selected_items: List[Dict] = None) -> str:
    selected_items = selected_items or [item for item in bill_data["line_items"] if item.get("flags")]
    intro = (
        "Hello,\n\n"
        "I hope you are well. I am reviewing my recent bill and would like to ask for clarification on a few items. "
        "I appreciate your help in making these charges easier to understand.\n\n"
    )

    body_lines = []
    for item in selected_items:
        body_lines.append(
            f"- {item['description']} for ${item['amount']:.2f}: {item.get('suspicious') or item.get('flags') or 'Needs review.'}"
        )

    closing = (
        "\nPlease let me know if any of these charges are incorrect or if there is additional information I should review. "
        "If possible, I would like a corrected bill or an explanation of the billing details.\n\n"
        "Thank you for your prompt attention to this matter.\n\n"
        "Sincerely,\n"
        "[Your Name]"
    )

    return intro + "\n".join(body_lines) + closing
