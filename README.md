# Explain My Bill

Explain My Bill is a bill analysis web app that helps users upload invoices, bills, and service contracts and then provides a plain-language explanation of every charge, highlights unusual fees, compares bills, and generates polite dispute letters.

## Tech stack
- Frontend: React + TypeScript + Vite
- Backend: Python FastAPI
- OCR: PyMuPDF + Tesseract / EasyOCR
- Storage: SQLite
- Charts: Recharts

## Project layout
- `backend/`: FastAPI server and bill processing modules
- `frontend/`: React user interface
- `sample_data/`: example bills and sample dataset

## Setup
### Backend
```powershell
cd "Explain My Bill\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```powershell
cd "Explain My Bill\frontend"
npm install
npm run dev
```

### Demo workflow
1. Start the backend server on port 8000.
2. Start the frontend with Vite on port 5173.
3. Open the app in your browser at `http://localhost:5173`.
4. Click **Load demo bills** to populate the app with sample bill history.
5. Select a bill, review line-item explanations, and click **Generate dispute letter**.
6. Click **Download summary** to export the bill summary as a PDF.

## Backend endpoints
- `POST /upload` — upload a PDF or image bill
- `GET /bills` — list saved bills
- `GET /bills/{bill_id}` — read a saved bill
- `GET /bills/{bill_id}/dispute` — generate a dispute letter
- `GET /bills/{bill_id}/summary-pdf` — download a bill summary PDF
- `POST /demo/load-samples` — load demo sample bills into the database

## Features
- Upload PDF or image bills
- Extract text and line items
- Generate human-readable explanations
- Flag suspicious fees and unclear terms
- Compare current bill with previous history
- Generate a dispute letter
- Export summary as PDF
