from sqlalchemy.orm import Session
from .. import models


def save_bill(db: Session, bill_data: dict):
    bill = models.Bill(
        title=bill_data["title"],
        category=bill_data.get("category", "General"),
        source=bill_data.get("source", "uploaded bill"),
        total_amount=bill_data.get("total_amount", 0.0),
        summary=bill_data.get("summary", ""),
        suspicious_score=bill_data.get("suspicious_score", 0.0),
    )
    db.add(bill)
    db.flush()

    for item in bill_data["line_items"]:
        line_item = models.LineItem(
            bill_id=bill.id,
            description=item["description"],
            amount=item["amount"],
            explanation=item.get("explanation", ""),
            suspicious=item.get("suspicious", ""),
            flags=item.get("flags", ""),
        )
        db.add(line_item)

    db.commit()
    db.refresh(bill)
    return bill
