from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String, index=True)
    source = Column(String)
    total_amount = Column(Float, default=0.0)
    suspicious_score = Column(Float, default=0.0)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    line_items = relationship("LineItem", back_populates="bill", cascade="all, delete-orphan")


class LineItem(Base):
    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    description = Column(String, index=True)
    amount = Column(Float)
    explanation = Column(Text)
    suspicious = Column(String)
    flags = Column(Text)

    bill = relationship("Bill", back_populates="line_items")
