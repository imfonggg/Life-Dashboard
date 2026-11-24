"""Request bodies the API accepts. Pydantic validates them before a route runs."""
from datetime import date
from typing import Literal

from pydantic import BaseModel

Priority = Literal["low", "medium", "high"]


# Auth

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# Money

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
    bill_file_id: int | None = None


class CategoryCreate(BaseModel):
    name: str
    type: str = "expense"


class BudgetCreate(BaseModel):
    category_id: int
    month: str
    amount: float


# Tasks

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    due_date: date | None = None
    priority: Priority = "medium"
    is_completed: bool = False


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: date | None = None
    priority: Priority | None = None
    is_completed: bool | None = None
