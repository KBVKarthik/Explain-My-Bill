import json
import os
import tempfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas
from .database import engine, get_db
from .processors import bill_parser, explanation_engine, history, dispute_generator, pdf_export

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Explain My Bill API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload", response_model=schemas.Bill)
def upload_bill(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type not in ["application/pdf", "image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    raw_text, bill_data = bill_parser.process_upload(file)
    if not bill_data["line_items"]:
        raise HTTPException(status_code=422, detail="Unable to extract line items from the bill")

    explanation_engine.enrich_bill(bill_data)
    saved_bill = history.save_bill(db, bill_data)
    return saved_bill


@app.get("/bills", response_model=List[schemas.Bill])
def list_bills(db: Session = Depends(get_db)):
    return db.query(models.Bill).order_by(models.Bill.created_at.desc()).all()


@app.get("/bills/{bill_id}", response_model=schemas.Bill)
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


@app.get("/bills/{bill_id}/dispute")
def get_dispute_letter(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    bill_data = {
        "title": bill.title,
        "category": bill.category,
        "total_amount": bill.total_amount,
        "suspicious_score": bill.suspicious_score,
        "summary": bill.summary,
        "line_items": [
            {
                "description": item.description,
                "amount": item.amount,
                "suspicious": item.suspicious,
                "flags": item.flags,
            }
            for item in bill.line_items
        ],
    }
    letter = dispute_generator.build_dispute_letter(bill_data)
    return {"bill_id": bill.id, "letter": letter}


@app.get("/bills/{bill_id}/summary-pdf")
def download_summary_pdf(bill_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    bill_data = {
        "title": bill.title,
        "category": bill.category,
        "total_amount": bill.total_amount,
        "suspicious_score": bill.suspicious_score,
        "summary": bill.summary,
        "line_items": [
            {
                "description": item.description,
                "amount": item.amount,
                "explanation": item.explanation,
                "flags": item.flags,
            }
            for item in bill.line_items
        ],
    }

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        output_path = tmp.name

    pdf_export.build_summary_pdf(bill_data, output_path)
    background_tasks.add_task(os.remove, output_path)
    return FileResponse(output_path, filename=f"{bill.title.replace(' ', '_')}_summary.pdf", media_type="application/pdf")


@app.post("/demo/load-samples")
def load_demo_bills(db: Session = Depends(get_db)):
    existing = db.query(models.Bill).count()
    if existing > 0:
        raise HTTPException(status_code=409, detail="Demo data already loaded")

    sample_path = Path(__file__).resolve().parents[2] / "sample_data" / "sample_bills.json"
    if not sample_path.exists():
        raise HTTPException(status_code=500, detail="Sample data file not found")

    with open(sample_path, "r", encoding="utf-8") as sample_file:
        demo_bills = json.load(sample_file)

    for bill_data in demo_bills:
        history.save_bill(db, bill_data)

    return {"loaded": len(demo_bills)}
