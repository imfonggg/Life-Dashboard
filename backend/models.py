# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)

    categories = relationship("Category", back_populates="user")
    bills = relationship("Bill", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")


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

    user = relationship("User", back_populates="bills")
    category = relationship("Category")


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