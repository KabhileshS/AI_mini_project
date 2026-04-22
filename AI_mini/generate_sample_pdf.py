from reportlab.pdfgen import canvas

def create_sample_pdf(filename):
    c = canvas.Canvas(filename)
    c.drawString(100, 800, "Bank Statement")
    c.drawString(100, 780, "Date: 2024-03-15")
    c.drawString(100, 760, "Merchant: Amazon")
    c.drawString(100, 740, "Amount: $45.99")
    c.drawString(100, 720, "Category: Shopping")
    c.drawString(100, 680, "Merchant: Safeway")
    c.drawString(100, 660, "Amount: $120.50")
    c.drawString(100, 640, "Category: Groceries")
    c.save()

if __name__ == "__main__":
    create_sample_pdf("sample_statement.pdf")
    print("PDF generated successfully.")
