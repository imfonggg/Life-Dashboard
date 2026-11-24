"""FastAPI app entry point. Run with: python -m uvicorn main:app --reload

Routes live in routers/, one file per area of the app:
  routers/auth.py        sign up, log in, current user
  routers/money.py       transactions, bills, categories, budgets
  routers/bill_files.py  bill uploads and downloads
  routers/tasks.py       tasks
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from routers import auth, bill_files, money, tasks

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Life Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Backend is alive"}


app.include_router(auth.router)
app.include_router(money.router)
app.include_router(bill_files.router)
app.include_router(tasks.router)
