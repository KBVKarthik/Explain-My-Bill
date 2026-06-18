from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class LineItemBase(BaseModel):
    description: str
    amount: float
    explanation: Optional[str] = None
    suspicious: Optional[str] = None
    flags: Optional[str] = None


class LineItemCreate(LineItemBase):
    pass


class LineItem(LineItemBase):
    id: int

    class Config:
        orm_mode = True


class BillBase(BaseModel):
    title: str
    category: str
    source: Optional[str] = None
    total_amount: Optional[float] = 0.0
    suspicious_score: Optional[float] = 0.0
    summary: Optional[str] = None


class BillCreate(BillBase):
    line_items: List[LineItemCreate]


class Bill(BillBase):
    id: int
    created_at: datetime
    line_items: List[LineItem]

    class Config:
        orm_mode = True
