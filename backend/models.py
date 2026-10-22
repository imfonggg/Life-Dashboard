# backend/models.py
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    categories = relationship("Category", back_populates="user")
    bills = relationship("Bill", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    tasks = relationship("Task", back_populates="user")
    bill_files = relationship("BillFile", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # expense, income, savings

    user = relationship("User", back_populates="categories")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    due_date = Column(Date, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    status = Column(String, default="pending")  # pending, paid, overdue
    is_recurring = Column(Boolean, default=True)
    bill_file_id = Column(Integer, ForeignKey("bill_files.id"), nullable=True)

    user = relationship("User", back_populates="bills")
    category = relationship("Category")
    bill_file = relationship("BillFile")


class BillFile(Base):
    __tablename__ = "bill_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)  # relative to the uploads folder
    content_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    extracted_text = Column(Text, nullable=True)
    extraction_method = Column(String, nullable=True)  # pattern, pattern+claude, or none

    user = relationship("User", back_populates="bill_files")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    month = Column(String, nullable=False)  # e.g. "2026-09"
    amount = Column(Float, nullable=False, default=0.0)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    type = Column(String, nullable=False)  # income or expense
    amount = Column(Float, nullable=False, default=0.0)
    description = Column(String, nullable=True)
    date = Column(Date, nullable=False)

    user = relationship("User", back_populates="transactions")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(Date, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high
    is_completed = Column(Boolean, default=False)

    user = relationship("User", back_populates="tasks")
