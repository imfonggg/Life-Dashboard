import os
from datetime import date, datetime, timedelta, timezone
from typing import cast

import jwt
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Transaction, Bill, User

app = FastAPI()
password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-this-secret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
MIN_PASSWORD_LENGTH = 12

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionCreate(BaseModel):
    category_id: int | None = None
    type: str
    amount: float
    description: str | None = None
    date: date

class BillCreate(BaseModel):
    name: str
    amount: float
    due_date: date
    category_id: int | None = None
    status: str | None = "pending"
    is_recurring: bool | None = True

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def create_access_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expires}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise credentials_error

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_error
    return user

@app.post("/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if len(payload.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        )
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=password_hash.hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(cast(int, user.id)), "token_type": "bearer"}

@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not password_hash.verify(payload.password, cast(str, user.password_hash)):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": create_access_token(cast(int, user.id)), "token_type": "bearer"}

@app.get("/auth/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email}

@app.get("/")
def read_root():
    return {"message": "Backend is alive"}

@app.get("/transactions")
def read_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    return transactions

@app.post("/transactions")
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
        date=payload.date
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@app.get("/bills")
def read_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bills = db.query(Bill).filter(Bill.user_id == current_user.id).all()
    return bills

@app.post("/bills")
def create_bill(
    payload: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bill = Bill(
        user_id = current_user.id,
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