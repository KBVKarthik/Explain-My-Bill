from typing import Dict


def build_summary_pdf(bill_data: Dict, output_path: str):
    try:
        from fpdf import FPDF
    except ImportError as exc:
        raise ImportError("fpdf2 is required for PDF export. Install it with pip install fpdf2") from exc

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Explain My Bill - Summary", ln=True)
    pdf.ln(4)

    pdf.set_font("Helvetica", size=12)
    pdf.cell(0, 8, f"Bill: {bill_data.get('title', 'Untitled')}", ln=True)
    pdf.cell(0, 8, f"Category: {bill_data.get('category', 'General')}", ln=True)
    pdf.cell(0, 8, f"Total amount: ${bill_data.get('total_amount', 0.0):.2f}", ln=True)
    pdf.cell(0, 8, f"Suspicion score: {bill_data.get('suspicious_score', 0.0):.2f}", ln=True)
    pdf.ln(4)

    line_width = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.multi_cell(line_width, 8, bill_data.get('summary', ''), align='L')
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, "Line item explanations", ln=True)
    pdf.ln(2)
    pdf.set_font("Helvetica", size=11)

    for item in bill_data.get('line_items', []):
        pdf.multi_cell(line_width, 7, f"- {item.get('description', '')} - ${item.get('amount', 0.0):.2f}", align='L')
        pdf.multi_cell(line_width, 7, f"  Explanation: {item.get('explanation', '')}", align='L')
        if item.get('flags'):
            pdf.multi_cell(line_width, 7, f"  Flags: {item.get('flags')}", align='L')
        pdf.ln(2)

    pdf.output(output_path)
