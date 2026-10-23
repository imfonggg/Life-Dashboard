# backend/bill_processing.py
# Reads text out of uploaded bill PDFs and guesses the bill's name, amount, due date and category.
# Pattern matching runs first and needs nothing extra. If ANTHROPIC_API_KEY is set, Claude fills in
# whatever the patterns missed; without a key the app still works on patterns alone.
import json
import os
import re
from datetime import date, datetime

import pdfplumber

MAX_PDF_PAGES = 10
MAX_TEXT_FOR_CLAUDE = 20000
CLAUDE_MODEL = os.getenv("BILL_EXTRACTION_MODEL", "claude-opus-5-5")

# Phrases that usually sit right before the amount owed, most specific first
AMOUNT_LABELS = [
    "total amount due",
    "amount due",
    "total due",
    "balance due",
    "new balance",
    "please pay",
    "amount owed",
    "payment amount",
    "total balance",
    "total",
]
DUE_DATE_LABELS = [
    "payment due date",
    "due date",
    "payment due",
    "due by",
    "due on",
    "pay by",
    "please pay by",
]
MONEY_PATTERN = r"\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})"
DATE_PATTERN = (
    r"(\d{4}-\d{1,2}-\d{1,2}"
    r"|\d{1,2}/\d{1,2}/\d{2,4}"
    r"|\d{1,2}-\d{1,2}-\d{2,4}"
    r"|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}"
    r"|\d{1,2}\s+[A-Za-z]{3,9}\.?,?\s+\d{4})"
)
DATE_FORMATS = [
    "%Y-%m-%d",
    "%m/%d/%Y",
    "%m/%d/%y",
    "%m-%d-%Y",
    "%m-%d-%y",
    "%B %d %Y",
    "%b %d %Y",
    "%d %B %Y",
    "%d %b %Y",
]

# Known senders and the kind of bill they send
KNOWN_VENDORS = {
    "comcast": ("Comcast", "internet"),
    "xfinity": ("Xfinity", "internet"),
    "spectrum": ("Spectrum", "internet"),
    "verizon": ("Verizon", "phone"),
    "at&t": ("AT&T", "phone"),
    "t-mobile": ("T-Mobile", "phone"),
    "pg&e": ("PG&E", "utilities"),
    "con edison": ("Con Edison", "utilities"),
    "duke energy": ("Duke Energy", "utilities"),
    "southern california edison": ("Southern California Edison", "utilities"),
    "netflix": ("Netflix", "subscriptions"),
    "spotify": ("Spotify", "subscriptions"),
    "geico": ("GEICO", "insurance"),
    "state farm": ("State Farm", "insurance"),
    "progressive": ("Progressive", "insurance"),
    "allstate": ("Allstate", "insurance"),
}

# Words in the bill text that point to a kind of bill
CATEGORY_KEYWORDS = {
    "utilities": ["electric", "electricity", "kwh", "natural gas", "water", "sewer", "trash", "energy", "utility"],
    "internet": ["internet", "broadband", "wifi", "cable tv"],
    "phone": ["wireless", "mobile", "cellular", "phone"],
    "housing": ["rent", "lease", "mortgage", "hoa", "property"],
    "insurance": ["insurance", "premium", "policy"],
    "subscriptions": ["subscription", "membership", "streaming"],
    "healthcare": ["medical", "hospital", "clinic", "dental", "pharmacy", "patient"],
    "credit card": ["credit card", "minimum payment", "statement balance"],
    "loan": ["loan", "principal", "installment"],
}

# Category names to look for among the user's own categories, in order of preference
CATEGORY_ALIASES = {
    "utilities": ["utilities", "utility", "bills"],
    "internet": ["internet", "utilities", "bills"],
    "phone": ["phone", "mobile", "utilities", "bills"],
    "housing": ["housing", "rent", "home"],
    "insurance": ["insurance", "bills"],
    "subscriptions": ["subscriptions", "subscription", "entertainment", "bills"],
    "healthcare": ["healthcare", "health", "medical"],
    "credit card": ["credit card", "debt", "bills"],
    "loan": ["loan", "loans", "debt", "bills"],
}

GENERIC_HEADER_WORDS = {"invoice", "statement", "bill", "page", "account", "summary", "customer", "date"}


def extract_pdf_text(path: str) -> str:
    with pdfplumber.open(path) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages[:MAX_PDF_PAGES]]
    return "\n".join(pages).strip()


def parse_date(value: str) -> date | None:
    cleaned = re.sub(r"\s+", " ", value.replace(",", " ").replace(".", " ")).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
    return None


def parse_money(value: str) -> float | None:
    try:
        amount = float(value.replace(",", "").replace("$", "").strip())
    except ValueError:
        return None
    return amount if amount > 0 else None


def find_amount(text: str) -> float | None:
    lowered = text.lower()
    for label in AMOUNT_LABELS:
        for match in re.finditer(re.escape(label), lowered):
            # Look at what follows the label on the same line or the next one
            window = text[match.end():match.end() + 80]
            money = re.search(MONEY_PATTERN, window)
            if money:
                amount = parse_money(money.group(1))
                if amount is not None:
                    return amount
    return None


def find_due_date(text: str) -> date | None:
    lowered = text.lower()
    for label in DUE_DATE_LABELS:
        for match in re.finditer(re.escape(label), lowered):
            window = text[match.end():match.end() + 80]
            found = re.search(DATE_PATTERN, window)
            if found:
                parsed = parse_date(found.group(1))
                if parsed is not None:
                    return parsed
    return None


def find_vendor(text: str) -> tuple[str | None, str | None]:
    lowered = text.lower()
    for keyword, (vendor, kind) in KNOWN_VENDORS.items():
        if keyword in lowered:
            return vendor, kind
    # Otherwise the sender's name is usually one of the first lines of the bill
    for line in text.splitlines()[:8]:
        line = line.strip()
        words = re.findall(r"[A-Za-z&'-]+", line)
        if len(words) == 0 or len(line) > 50:
            continue
        if any(word.lower() in GENERIC_HEADER_WORDS for word in words) and len(words) <= 2:
            continue
        if re.search(r"\d{3,}", line):
            continue
        return line, None
    return None, None


def guess_category_kind(text: str) -> str | None:
    lowered = text.lower()
    best_kind, best_hits = None, 0
    for kind, keywords in CATEGORY_KEYWORDS.items():
        hits = sum(len(re.findall(r"\b" + re.escape(keyword) + r"\b", lowered)) for keyword in keywords)
        if hits > best_hits:
            best_kind, best_hits = kind, hits
    return best_kind


def match_category(kind: str | None, categories: list[dict]) -> dict | None:
    if not kind:
        return None
    by_name = {category["name"].strip().lower(): category for category in categories}
    for alias in CATEGORY_ALIASES.get(kind, [kind]):
        if alias in by_name:
            return by_name[alias]
    return None


def parse_bill_text(text: str) -> dict:
    vendor, vendor_kind = find_vendor(text)
    return {
        "name": vendor,
        "amount": find_amount(text),
        "due_date": find_due_date(text),
        "category_kind": vendor_kind or guess_category_kind(text),
    }


def claude_is_configured() -> bool:
    if not os.getenv("ANTHROPIC_API_KEY"):
        return False
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    return True


def extract_with_claude(text: str, category_names: list[str]) -> dict | None:
    import anthropic

    schema = {
        "type": "object",
        "properties": {
            "vendor": {"type": ["string", "null"]},
            "amount_due": {"type": ["number", "null"]},
            "due_date": {"type": ["string", "null"], "description": "YYYY-MM-DD"},
            "category": {"type": ["string", "null"]},
        },
        "required": ["vendor", "amount_due", "due_date", "category"],
        "additionalProperties": False,
    }
    prompt = (
        "Read this bill and return who sent it, the total amount due, and the payment due date. "
        "Use null for anything the bill does not say. "
        f"For category, pick the best fit from this list, or null if none fits: {json.dumps(category_names)}.\n\n"
        f"<bill>\n{text[:MAX_TEXT_FOR_CLAUDE]}\n</bill>"
    )
    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2000,
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": schema}},
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError as error:
        print(f"Claude bill extraction failed: {error}")
        return None
    if response.stop_reason != "end_turn":
        return None
    text_block = next((block.text for block in response.content if block.type == "text"), None)
    if text_block is None:
        return None
    try:
        data = json.loads(text_block)
    except json.JSONDecodeError:
        return None
    return {
        "name": data.get("vendor"),
        "amount": parse_money(str(data["amount_due"])) if data.get("amount_due") is not None else None,
        "due_date": parse_date(data["due_date"]) if data.get("due_date") else None,
        "category_name": data.get("category"),
    }


def extract_bill_details(text: str, categories: list[dict]) -> tuple[dict, str]:
    """Return the fields to prefill the add-bill form with, and which method found them."""
    fields = parse_bill_text(text)
    category = match_category(fields.pop("category_kind"), categories)
    method = "pattern"

    missing = not fields["name"] or fields["amount"] is None or fields["due_date"] is None or category is None
    if missing and text and claude_is_configured():
        claude_fields = extract_with_claude(text, [c["name"] for c in categories])
        if claude_fields:
            method = "pattern+claude"
            for key in ("name", "amount", "due_date"):
                if not fields[key] and claude_fields[key]:
                    fields[key] = claude_fields[key]
            if category is None and claude_fields["category_name"]:
                wanted = claude_fields["category_name"].strip().lower()
                category = next((c for c in categories if c["name"].strip().lower() == wanted), None)

    return {
        "name": fields["name"],
        "amount": fields["amount"],
        "due_date": fields["due_date"].isoformat() if fields["due_date"] else None,
        "category_id": category["id"] if category else None,
        "category_name": category["name"] if category else None,
    }, method
