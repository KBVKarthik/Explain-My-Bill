import os
import re
from pathlib import Path
from typing import Dict, List
from fastapi import UploadFile
import tempfile

SUPPORTED_TYPES = ["application/pdf", "image/png", "image/jpeg"]


def extract_text_from_pdf(file_path: str) -> str:
    try:
        import fitz
    except ImportError as exc:
        raise ImportError("PyMuPDF is required for PDF parsing. Install it with pip install PyMuPDF") from exc

    try:
        from PIL import Image
    except ImportError as exc:
        raise ImportError("Pillow is required for image rendering. Install it with pip install Pillow") from exc
    import pytesseract

    text = []
    doc = fitz.open(file_path)
    for page in doc:
        page_text = page.get_text("text")
        if page_text:
            text.append(page_text)
        else:
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text.append(pytesseract.image_to_string(img))
    return "\n".join(text)


def extract_text_from_image(file_path: str) -> str:
    try:
        from PIL import Image
    except ImportError as exc:
        raise ImportError("Pillow is required for image OCR. Install it with pip install Pillow") from exc

    try:
        import easyocr
    except ImportError as exc:
        raise ImportError("EasyOCR is required for image OCR. Install it with pip install easyocr") from exc

    img = Image.open(file_path)
    reader = easyocr.Reader(["en"], gpu=False)
    data = reader.readtext(file_path, detail=0)
    return "\n".join(data)


def parse_line_items(raw_text: str) -> List[Dict]:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    items = []
    for line in lines:
        match = re.search(r"(?P<description>.+?)\s{2,}(?P<amount>[-$]?\d{1,3}(?:[\d,]*)(?:\.\d{2})?)$", line)
        if match:
            desc = match.group("description").strip()
            if desc.lower() in {"total", "subtotal", "balance due", "amount due", "due"}:
                continue
            amount_text = match.group("amount").replace("$", "").replace(",", "")
            try:
                amount = float(amount_text)
            except ValueError:
                continue
            items.append({"description": desc, "amount": amount})

    return items


def find_total_amount(raw_text: str) -> float:
    total_match = re.search(r"Total[:\s]+\$?([\d,]+(?:\.\d{2})?)", raw_text, re.IGNORECASE)
    if total_match:
        return float(total_match.group(1).replace(",", ""))
    return 0.0


import tempfile


def process_upload(file: UploadFile) -> (str, Dict):
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as out_file:
        out_file.write(file.file.read())
        file_path = out_file.name

    try:
        raw_text = ""
        if file.content_type == "application/pdf":
            raw_text = extract_text_from_pdf(file_path)
        else:
            raw_text = extract_text_from_image(file_path)

        line_items = parse_line_items(raw_text)
        total_amount = find_total_amount(raw_text)
        title = Path(file.filename).stem

        return raw_text, {
            "title": title,
            "category": "General",
            "source": file.filename,
            "total_amount": total_amount,
            "summary": "",
            "suspicious_score": 0.0,
            "line_items": line_items,
        }
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
