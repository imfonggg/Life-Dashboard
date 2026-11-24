"""Sign up, log in, and "who am I" for the current token."""
from typing import cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from security import create_access_token, get_current_user, password_hash
from config import MIN_PASSWORD_LENGTH
from database import get_db
from models import User
from schemas import LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def token_response(user: User) -> dict:
    return {"access_token": create_access_token(cast(int, user.id)), "token_type": "bearer"}


@router.post("/register")
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
    return token_response(user)


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not password_hash.verify(payload.password, cast(str, user.password_hash)):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return token_response(user)


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email}
