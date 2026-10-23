# backend/init_db.py
from sqlalchemy import inspect, text

from database import engine, Base
from models import User, Category, Bill, BillFile, Budget, Transaction, Task

# Older databases were created before users.password_hash existed; add it in place.
# On a fresh database the users table does not exist yet, so skip straight to create_all.
inspector = inspect(engine)
if inspector.has_table("users"):
	columns = {column["name"] for column in inspector.get_columns("users")}
	if "password_hash" not in columns:
		with engine.begin() as connection:
			connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))

# Bills created before uploads were processed have no link to their original file.
if inspector.has_table("bills"):
	columns = {column["name"] for column in inspector.get_columns("bills")}
	if "bill_file_id" not in columns:
		with engine.begin() as connection:
			connection.execute(text("ALTER TABLE bills ADD COLUMN bill_file_id INTEGER REFERENCES bill_files(id)"))

Base.metadata.create_all(bind=engine)
