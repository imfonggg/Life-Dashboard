"""Settings and constants shared across the backend.

Values that differ between machines come from environment variables so nothing secret
has to live in the code.
"""
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

# Database
DATABASE_URL = "sqlite:///./life-dashboard.db"

# Frontend origins allowed to call the API
CORS_ORIGINS = ["http://localhost:3000"]

# Auth
JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-this-secret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
MIN_PASSWORD_LENGTH = 12

# Bill uploads
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(BACKEND_DIR, "uploads"))
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
UPLOAD_EXTENSIONS = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png"}
ALLOWED_UPLOAD_TYPES = set(UPLOAD_EXTENSIONS)

# Budgets and categories
CATEGORY_TYPES = {"expense", "income", "savings"}
MONTH_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"  # "YYYY-MM"
