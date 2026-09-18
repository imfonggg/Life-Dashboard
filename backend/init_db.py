# backend/init_db.py
from database import engine, Base
from models import User, Category, Bill, Budget, Transaction

Base.metadata.create_all(bind=engine)