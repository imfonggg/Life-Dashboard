"""Uploading bill files, reading their details to prefill the Add Bill form, and downloading them again."""
import logging
import os
import uuid
from typing import cast

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from security import get_current_user
from bill_processing import EMPTY_BILL_DETAILS, extract_bill_details, extract_pdf_text
from config import ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE_BYTES, UPLOAD_DIR, UPLOAD_EXTENSIONS
from database import get_db
from models import BillFile, Category, User
from ownership import get_owned_bill_file

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bills", tags=["bill files"])


async def read_validated_upload(file: UploadFile) -> bytes:
    """Read the upload, rejecting wrong types, empty files, oversized files and fake PDFs."""
    if file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(status_code=415, detail="Upload a PDF, JPEG, or PNG")
    # Read one byte past the limit so an oversized file is detected without reading all of it
    contents = await file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too big, please only upload a file 10MB or less")
    if file.content_type == "application/pdf" and not contents.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="That file does not look like a PDF")
    return contents


def save_upload(user: User, content_type: str, contents: bytes) -> tuple[str, str]:
    """Write the file to disk and return (path relative to UPLOAD_DIR, full path)."""
    # A random name means a user-supplied filename never becomes part of a disk path
    stored_path = os.path.join("bills", str(user.id), f"{uuid.uuid4().hex}{UPLOAD_EXTENSIONS[content_type]}")
    full_path = os.path.join(UPLOAD_DIR, stored_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as saved_file:
        saved_file.write(contents)
    return stored_path, full_path


def upload_message(is_pdf: bool, extracted_text: str | None, extracted: dict) -> str:
    """Tell the user what happened, so they know how much of the form they still have to fill in."""
    if not is_pdf:
        return "File saved. Reading images is not supported yet, so please fill in the bill details."
    if not extracted_text:
        return "File saved, but no text was found in it (it may be a scan). Please fill in the bill details."
    if any(value is not None for value in extracted.values()):
        return "File saved. Check the details in the Add Bill form, then add the bill."
    return "File saved, but the bill details could not be found. Please fill them in."


@router.post("/upload")
async def upload_bill_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contents = await read_validated_upload(file)
    content_type = cast(str, file.content_type)
    is_pdf = content_type == "application/pdf"
    stored_path, full_path = save_upload(current_user, content_type, contents)

    # Only digital PDFs can be read for now; images and scans are saved but not read
    extracted_text: str | None = None
    extraction_method = "none"
    extracted = dict(EMPTY_BILL_DETAILS)
    if is_pdf:
        try:
            extracted_text = await run_in_threadpool(extract_pdf_text, full_path)
        except Exception:
            logger.exception("Could not read text from %s", stored_path)
        if extracted_text:
            categories = db.query(Category).filter(Category.user_id == current_user.id, Category.type != "income").all()
            category_rows = [{"id": category.id, "name": category.name} for category in categories]
            extracted, extraction_method = await run_in_threadpool(extract_bill_details, extracted_text, category_rows)

    bill_file = BillFile(
        user_id=current_user.id,
        original_filename=file.filename or "bill",
        stored_path=stored_path,
        content_type=content_type,
        size_bytes=len(contents),
        extracted_text=extracted_text,
        extraction_method=extraction_method,
    )
    db.add(bill_file)
    db.commit()
    db.refresh(bill_file)

    return {
        "file_id": bill_file.id,
        "filename": bill_file.original_filename,
        "size_bytes": bill_file.size_bytes,
        "extraction_method": extraction_method,
        "extracted": extracted,
        "message": upload_message(is_pdf, extracted_text, extracted),
    }


@router.get("/files/{file_id}")
def download_bill_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bill_file = cast(BillFile, get_owned_bill_file(db, current_user, file_id))
    full_path = os.path.join(UPLOAD_DIR, cast(str, bill_file.stored_path))
    if not os.path.exists(full_path):
        logger.warning("Bill file %s is in the database but missing from %s", bill_file.id, full_path)
        raise HTTPException(status_code=404, detail="Bill file is missing from storage")
    return FileResponse(
        full_path,
        media_type=cast(str, bill_file.content_type),
        filename=cast(str, bill_file.original_filename),
    )
