"""Creating, listing, updating and deleting the user's tasks."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from security import get_current_user
from database import get_db
from models import Task, User
from ownership import get_owned_task
from schemas import TaskCreate, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Fields that may be left out of a PATCH but cannot be set to null
NON_NULLABLE_FIELDS = ("priority", "is_completed")


@router.get("")
def read_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Task).filter(Task.user_id == current_user.id).all()


@router.post("")
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Task title is required")
    task = Task(
        user_id=current_user.id,
        title=title,
        description=payload.description,
        due_date=payload.due_date,
        priority=payload.priority,
        is_completed=payload.is_completed,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}")
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_task(db, current_user, task_id)


@router.patch("/{task_id}")
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_owned_task(db, current_user, task_id)
    # Only the fields the client actually sent are changed
    updates = payload.model_dump(exclude_unset=True)
    if "title" in updates:
        if updates["title"] is None or not updates["title"].strip():
            raise HTTPException(status_code=400, detail="Task title is required")
        updates["title"] = updates["title"].strip()
    for field in NON_NULLABLE_FIELDS:
        if field in updates and updates[field] is None:
            raise HTTPException(status_code=400, detail=f"Task {field} cannot be empty")

    for field, value in updates.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_owned_task(db, current_user, task_id)
    db.delete(task)
    db.commit()
