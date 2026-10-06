# backend/init_db.py
from sqlalchemy import inspect, text

from database import engine, Base
from models import User, Category, Bill, Budget, Transaction

with engine.begin() as connection:
	columns = {column["name"] for column in inspect(engine).get_columns("users")}
	if columns and "password_hash" not in columns:
		connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))

Base.metadata.create_all(bind=engine)