from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from datetime import date
from models import Transaction, Bill

app = FastAPI()

class TransactionCreate(BaseModel):
    user_id: int
    category_id: int | None = None
    type: str
    amount: float
    description: str | None = None
    date: date

class BillCreate(BaseModel):
    user_id: int
    name: str
    amount: float
    due_date: date
    category_id: int | None = None
    status: str | None = "pending"
    is_recurring: bool | None = True

@app.get("/")
def read_root():
    return {"message": "Backend is alive"}

@app.get("/transactions")
def read_transactions(db: Session = Depends(get_db)):
    transactions = db.query(Transaction).all()
    return transactions

@app.post("/transactions")
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    transaction = Transaction(
        user_id=payload.user_id,
        category_id=payload.category_id,
        type=payload.type,
        amount=payload.amount,
        description=payload.description,
        date=payload.date
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@app.get("/bills")
def read_bills(db: Session = Depends(get_db)):
    bills = db.query(Bill).all()
    return bills

@app.post("/bills")
def create_bill(payload: BillCreate, db: Session = Depends(get_db)):
    bill = Bill(
        user_id = payload.user_id,
        name = payload.name,
        amount = payload.amount,
        due_date = payload.due_date,
        category_id = payload.category_id,
        status = payload.status,
        is_recurring = payload.is_recurring
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill