from pydantic import BaseModel, Field
import datetime
from typing import Optional

class ExpenseBase(BaseModel):
    date: datetime.date = Field(description="The date of the expense in YYYY-MM-DD format")
    merchant: str = Field(description="The name of the merchant or store")
    total: float = Field(description="The total amount of the expense")
    category: str = Field(description="The category of the expense (e.g., Groceries, Utilities, Dining, Entertainment, Transportation, etc.)")

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseRead(ExpenseBase):
    id: int

    model_config = {"from_attributes": True}

# Schema for Gemini structured extraction
class ExpenseExtraction(BaseModel):
    date: str = Field(description="The date of the expense in YYYY-MM-DD format. If exact date is not found, use a best guess or null.")
    merchant: str = Field(description="The name of the merchant or store")
    total: float = Field(description="The total amount of the expense")
    category: str = Field(description="The category of the expense (e.g., Groceries, Utilities, Dining, Entertainment, Transportation, etc.)")

class ChatMessage(BaseModel):
    message: str
