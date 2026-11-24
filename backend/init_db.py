"""Create the database tables, and bring older databases up to date.

Run with: python init_db.py   (safe to run again; it only adds what is missing)
"""
from sqlalchemy import inspect, text

import models  # noqa: F401  (importing registers every table on Base.metadata)
from database import Base, engine


def add_column_if_missing(table: str, column: str, definition: str) -> None:
    """Add a column to an existing table. Does nothing on a fresh database where the table is not created yet."""
    inspector = inspect(engine)
    if not inspector.has_table(table):
        return
    existing_columns = {col["name"] for col in inspector.get_columns(table)}
    if column not in existing_columns:
        with engine.begin() as connection:
            connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
        print(f"Added {table}.{column}")


def init_db() -> None:
    # Older databases were created before these columns existed
    add_column_if_missing("users", "password_hash", "VARCHAR")
    add_column_if_missing("bills", "bill_file_id", "INTEGER REFERENCES bill_files(id)")
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database is ready.")
