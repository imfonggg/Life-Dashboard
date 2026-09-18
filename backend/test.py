from datetime import date

from database import SessionLocal
from models import User, Category, Bill, Budget, Transaction

db = SessionLocal()

unique_email = "seed-user-2026@example.com"
user = db.query(User).filter_by(email=unique_email).first()
if user is None:
    user = User(name="Test User", email=unique_email)
    db.add(user)
    db.commit()
    db.refresh(user)

# Create categories if they do not exist
category_names = ["Housing", "Groceries", "Utilities", "Salary", "Savings"]
existing_categories = {c.name: c for c in db.query(Category).filter_by(user_id=user.id).all()}
for name in category_names:
    if name not in existing_categories:
        category_type = "expense" if name in ["Housing", "Groceries", "Utilities"] else "income" if name == "Salary" else "savings"
        category = Category(user_id=user.id, name=name, type=category_type)
        db.add(category)

db.commit()
cat_map = {c.name: c for c in db.query(Category).filter_by(user_id=user.id).all()}

# Sample bills
bills = [
    Bill(user_id=user.id, name="Rent", amount=1600.00, due_date=date(2026, 9, 25), category_id=cat_map["Housing"].id, status="pending", is_recurring=True),
    Bill(user_id=user.id, name="Groceries", amount=220.00, due_date=date(2026, 9, 18), category_id=cat_map["Groceries"].id, status="pending", is_recurring=True),
    Bill(user_id=user.id, name="Electric", amount=120.00, due_date=date(2026, 9, 27), category_id=cat_map["Utilities"].id, status="pending", is_recurring=True),
]

for bill in bills:
    existing_bill = db.query(Bill).filter_by(user_id=user.id, name=bill.name, due_date=bill.due_date).first()
    if existing_bill is None:
        db.add(bill)

# Sample budgets
budgets = [
    Budget(user_id=user.id, category_id=cat_map["Housing"].id, month="2026-09", amount=2000.00),
    Budget(user_id=user.id, category_id=cat_map["Groceries"].id, month="2026-09", amount=500.00),
    Budget(user_id=user.id, category_id=cat_map["Utilities"].id, month="2026-09", amount=300.00),
    Budget(user_id=user.id, category_id=cat_map["Savings"].id, month="2026-09", amount=600.00),
]

for budget in budgets:
    existing_budget = db.query(Budget).filter_by(user_id=user.id, category_id=budget.category_id, month=budget.month).first()
    if existing_budget is None:
        db.add(budget)

# Sample transactions
transactions = [
    Transaction(user_id=user.id, category_id=cat_map["Salary"].id, type="income", amount=4800.00, description="Monthly paycheck", date=date(2026, 9, 1)),
    Transaction(user_id=user.id, category_id=cat_map["Housing"].id, type="expense", amount=1600.00, description="Rent", date=date(2026, 9, 25)),
    Transaction(user_id=user.id, category_id=cat_map["Groceries"].id, type="expense", amount=210.00, description="Groceries", date=date(2026, 9, 15)),
    Transaction(user_id=user.id, category_id=cat_map["Savings"].id, type="expense", amount=300.00, description="Emergency fund", date=date(2026, 9, 10)),
]

for transaction in transactions:
    existing_transaction = db.query(Transaction).filter_by(user_id=user.id, description=transaction.description, date=transaction.date).first()
    if existing_transaction is None:
        db.add(transaction)

db.commit()

print("User:", db.query(User).count())
print("Categories:", db.query(Category).count())
print("Bills:", db.query(Bill).count())
print("Budgets:", db.query(Budget).count())
print("Transactions:", db.query(Transaction).count())

print("Sample user:", db.query(User).filter_by(email=unique_email).first().email)
print("Sample bill:", db.query(Bill).filter_by(user_id=user.id).first().name, db.query(Bill).filter_by(user_id=user.id).first().amount)
