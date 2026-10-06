# Life Dashboard

Life Dashboard is a personal finance dashboard app for tracking transactions, bills, and category-based budgeting. It uses a modern frontend for the UI and a FastAPI backend with SQLite for data storage.

## Tech stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Material Tailwind
- React Icons

The frontend lives in the `frontend/` directory and runs locally on port `3000`.

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite

The backend lives in the `backend/` directory and exposes a REST API that serves transaction and bill data. It runs on port `8000` by default.

## Project structure

- `frontend/` – Next.js app and UI components
- `backend/` – FastAPI API server and SQLite database models
- `life-dashboard.db` – SQLite database used by the backend

## Running the app

### 1) Start the backend

Open a terminal in the `backend/` folder and create a virtual environment if needed:

```bash
cd backend
python -m venv .venv
```

On Windows PowerShell:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
```

Then install dependencies and initialize the database:

```bash
pip install -r requirements.txt
python init_db.py
```

Start the API server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend should be available at:
- http://localhost:8000
- API docs: http://localhost:8000/docs

### 2) Start the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Notes

- The frontend is configured to talk to the backend at `http://localhost:8000`.
- The backend uses SQLite, so no external database service is required.
- If the database has not been created yet, run `python init_db.py` inside `backend/` before starting the API.
