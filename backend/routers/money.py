"""Transactions, bills, categories and monthly budgets."""
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from security import get_current_user
from config import CATEGORY_TYPES, MONTH_PATTERN
from database import get_db
from models import Bill, Budget, Category, Transaction, User
from ownership import get_owned_bill_file, get_owned_category
from schemas import BillCreate, BudgetCreate, CategoryCreate, TransactionCreate

router = APIRouter(tags=["money"])


def serialize_budget(budget: Budget) -> dict:
    return {
        "id": budget.id,
        "category_id": budget.category_id,
        "category_name": budget.category.name if budget.category else None,
        "month": budget.month,
        "amount": budget.amount,
    }


# Transactions

@router.get("/transactions")
def read_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Transaction).filter(Transaction.user_id == current_user.id).all()


@router.post("/transactions")
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = Transaction(
        user_id=current_user.id,
        category_id=payload.category_id,
        type=payload.type,
        amount=payload.amount,
        description=payload.description,
        date=payload.date,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


# Bills

@router.get("/bills")
def read_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Bill).filter(Bill.user_id == current_user.id).all()


@router.post("/bills")
def create_bill(
    payload: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Both lookups raise 404 if the id belongs to someone else
    get_owned_category(db, current_user, payload.category_id)
    get_owned_bill_file(db, current_user, payload.bill_file_id)

    bill = Bill(
        user_id=current_user.id,
        name=payload.name,
        amount=payload.amount,
        due_date=payload.due_date,
        category_id=payload.category_id,
        status=payload.status,
        is_recurring=payload.is_recurring,
        bill_file_id=payload.bill_file_id,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill


# Categories

@router.get("/categories")
def read_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Category).filter(Category.user_id == current_user.id).order_by(Category.name).all()


@router.post("/categories")
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")
    if payload.type not in CATEGORY_TYPES:
        raise HTTPException(status_code=400, detail="Category type must be expense, income, or savings")
    existing = db.query(Category).filter(Category.user_id == current_user.id, Category.name == name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists")

    category = Category(user_id=current_user.id, name=name, type=payload.type)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# Budgets

@router.get("/budgets")
def read_budgets(
    month: str | None = Query(default=None, pattern=MONTH_PATTERN),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    if month:
        query = query.filter(Budget.month == month)
    return [serialize_budget(budget) for budget in query.all()]


@router.post("/budgets")
def create_or_update_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not re.match(MONTH_PATTERN, payload.month):
        raise HTTPException(status_code=400, detail="Month must look like YYYY-MM")
    if payload.amount < 0:
        raise HTTPException(status_code=400, detail="Budget amount cannot be negative")
    get_owned_category(db, current_user, payload.category_id)

    # One budget per category per month: posting again updates the amount
    budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == payload.category_id,
        Budget.month == payload.month,
    ).first()
    if budget is None:
        budget = Budget(user_id=current_user.id, category_id=payload.category_id, month=payload.month)
        db.add(budget)
    budget.amount = payload.amount
    db.commit()
    db.refresh(budget)
    return serialize_budget(budget)
