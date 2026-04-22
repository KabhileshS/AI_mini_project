from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from dotenv import load_dotenv

# Load env variables
load_dotenv()

import models, schemas, database, gemini_service

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Expense Tracker API")

@app.post("/upload", response_model=List[schemas.ExpenseExtraction])
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    mime_type = file.content_type
    
    try:
        if mime_type in ["image/jpeg", "image/png"]:
            extracted_data = gemini_service.extract_from_image(contents, mime_type)
            return extracted_data
        elif mime_type == "application/pdf":
            extracted_data = gemini_service.extract_from_pdf(contents, mime_type)
            return extracted_data
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

@app.post("/expenses/", response_model=schemas.ExpenseRead)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(database.get_db)):
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/expenses/", response_model=List[schemas.ExpenseRead])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    expenses = db.query(models.Expense).offset(skip).limit(limit).all()
    return expenses

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(database.get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return {"ok": True}

@app.post("/chat")
def chat_endpoint(chat: schemas.ChatMessage, db: Session = Depends(database.get_db)):
    expenses = db.query(models.Expense).all()
    expenses_data = [
        {
            "id": e.id,
            "date": str(e.date),
            "merchant": e.merchant,
            "total": e.total,
            "category": e.category
        }
        for e in expenses
    ]
    import json
    expenses_json = json.dumps(expenses_data)
    
    try:
        reply = gemini_service.chat_with_data(chat.message, expenses_json)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
