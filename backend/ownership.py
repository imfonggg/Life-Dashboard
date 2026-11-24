"""Look up a record by id, but only if it belongs to the current user (404 otherwise).

Every route that takes an id from the client goes through one of these, so one user
can never read or link to another user's data.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import BillFile, Category, Task, User


def get_owned_category(db: Session, user: User, category_id: int | None) -> Category | None:
    if category_id is None:
        return None
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user.id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


def get_owned_bill_file(db: Session, user: User, bill_file_id: int | None) -> BillFile | None:
    if bill_file_id is None:
        return None
    bill_file = db.query(BillFile).filter(BillFile.id == bill_file_id, BillFile.user_id == user.id).first()
    if bill_file is None:
        raise HTTPException(status_code=404, detail="Bill file not found")
    return bill_file


def get_owned_task(db: Session, user: User, task_id: int) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
