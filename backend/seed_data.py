"""Fill the database with a sample user and some example bills, budgets and transactions.

This is for trying the app out locally, not a test suite. It is safe to run more than once.
Run with: python seed_data.py   (after python init_db.py)
Then log in as seed-user-2026@example.com / password123
"""
from datetime import date

from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Bill, Budget, Category, Transaction, User

SEED_EMAIL = "seed-user-2026@example.com"
SEED_PASSWORD = "password123"
SEED_MONTH = "2026-09"
SEED_CATEGORIES = {
    "Housing": "expense",
    "Groceries": "expense",
    "Utilities": "expense",
    "Salary": "income",
    "Savings": "savings",
}


def get_or_create_user(db: Session) -> User:
    password_hash = PasswordHash.recommended()
    user = db.query(User).filter_by(email=SEED_EMAIL).first()
    if user is None:
        user = User(name="Test User", email=SEED_EMAIL, password_hash=password_hash.hash(SEED_PASSWORD))
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.password_hash is None:
        user.password_hash = password_hash.hash(SEED_PASSWORD)
        db.commit()
    return user


def get_or_create_categories(db: Session, user: User) -> dict[str, Category]:
    existing = {c.name for c in db.query(Category).filter_by(user_id=user.id).all()}
    for name, category_type in SEED_CATEGORIES.items():
        if name not in existing:
            db.add(Category(user_id=user.id, name=name, type=category_type))
    db.commit()
    return {c.name: c for c in db.query(Category).filter_by(user_id=user.id).all()}


def add_sample_records(db: Session, user: User, categories: dict[str, Category]) -> None:
    def category_id(name: str) -> int:
        return categories[name].id

    bills = [
        Bill(user_id=user.id, name="Rent", amount=1600.00, due_date=date(2026, 9, 25), category_id=category_id("Housing"), status="pending", is_recurring=True),
        Bill(user_id=user.id, name="Groceries", amount=220.00, due_date=date(2026, 9, 18), category_id=category_id("Groceries"), status="pending", is_recurring=True),
        Bill(user_id=user.id, name="Electric", amount=120.00, due_date=date(2026, 9, 27), category_id=category_id("Utilities"), status="pending", is_recurring=True),
    ]
    for bill in bills:
        if db.query(Bill).filter_by(user_id=user.id, name=bill.name, due_date=bill.due_date).first() is None:
            db.add(bill)

    budgets = [
        Budget(user_id=user.id, category_id=category_id("Housing"), month=SEED_MONTH, amount=2000.00),
        Budget(user_id=user.id, category_id=category_id("Groceries"), month=SEED_MONTH, amount=500.00),
        Budget(user_id=user.id, category_id=category_id("Utilities"), month=SEED_MONTH, amount=300.00),
        Budget(user_id=user.id, category_id=category_id("Savings"), month=SEED_MONTH, amount=600.00),
    ]
    for budget in budgets:
        if db.query(Budget).filter_by(user_id=user.id, category_id=budget.category_id, month=budget.month).first() is None:
            db.add(budget)

    transactions = [
        Transaction(user_id=user.id, category_id=category_id("Salary"), type="income", amount=4800.00, description="Monthly paycheck", date=date(2026, 9, 1)),
        Transaction(user_id=user.id, category_id=category_id("Housing"), type="expense", amount=1600.00, description="Rent", date=date(2026, 9, 25)),
        Transaction(user_id=user.id, category_id=category_id("Groceries"), type="expense", amount=210.00, description="Groceries", date=date(2026, 9, 15)),
        Transaction(user_id=user.id, category_id=category_id("Savings"), type="expense", amount=300.00, description="Emergency fund", date=date(2026, 9, 10)),
    ]
    for transaction in transactions:
        if db.query(Transaction).filter_by(user_id=user.id, description=transaction.description, date=transaction.date).first() is None:
            db.add(transaction)

    db.commit()


def print_summary(db: Session) -> None:
    print("Users:", db.query(User).count())
    print("Categories:", db.query(Category).count())
    print("Bills:", db.query(Bill).count())
    print("Budgets:", db.query(Budget).count())
    print("Transactions:", db.query(Transaction).count())
    print(f"Sample login: {SEED_EMAIL} / {SEED_PASSWORD}")


def main() -> None:
    db = SessionLocal()
    try:
        user = get_or_create_user(db)
        categories = get_or_create_categories(db, user)
        add_sample_records(db, user, categories)
        print_summary(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
