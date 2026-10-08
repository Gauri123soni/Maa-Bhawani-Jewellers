from datetime import datetime, timezone
from pathlib import Path
from typing import List
import hashlib
import hmac
import secrets

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Maa Bhawani Jewellers API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SubscribeRequest(BaseModel):
    email: str


class RateUpdateRequest(BaseModel):
    metal: str
    purity: str = "24"
    rate: float = Field(gt=0)


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class OrderItem(BaseModel):
    id: str
    name: str
    category: str = "Jewellery"
    image: str = ""
    price: float = Field(ge=0)
    quantity: int = Field(default=1, ge=1, le=99)


class CreateOrderRequest(BaseModel):
    customer: str = "Guest"
    email: str = ""
    items: List[OrderItem] = Field(min_length=1)


subscribers: List[str] = []
rates = {
    "gold24": 75000,
    "gold22": 69000,
    "gold18": 56500,
    "silver": 90000,
    "source": "sample",
    "updatedAt": datetime.now(timezone.utc).isoformat(),
}
users = {}
orders = {}


def normalized_email(email: str) -> str:
    return email.strip().lower()


def valid_email(email: str) -> bool:
    return "@" in email and "." in email.rsplit("@", 1)[-1]


@app.get("/api/health")
async def health_check() -> dict:
    return {"status": "ok", "service": "fastapi"}


@app.post("/api/subscribe")
async def subscribe(payload: SubscribeRequest) -> dict:
    email = normalized_email(payload.email)
    if not valid_email(email):
        raise HTTPException(status_code=400, detail="Please provide a valid email.")

    if email not in subscribers:
        subscribers.append(email)

    return {"success": True, "message": f"Thank you for subscribing, {email}!"}


@app.get("/api/subscribers")
async def get_subscribers() -> dict:
    return {"count": len(subscribers), "subscribers": subscribers}


@app.get("/api/rates")
async def get_rates() -> dict:
    return rates


@app.post("/api/rates")
async def update_rates(payload: RateUpdateRequest) -> dict:
    purity = payload.purity.strip()
    key = "silver" if payload.metal == "silver" else f"gold{purity}"
    if key not in rates or key == "updatedAt":
        raise HTTPException(status_code=400, detail="Choose a supported metal and purity.")
    rates[key] = payload.rate
    rates["source"] = "admin"
    rates["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"success": True, "message": "Rate updated successfully.", "rates": rates}


@app.post("/api/register", status_code=201)
async def register(payload: RegisterRequest) -> dict:
    name = payload.name.strip()
    email = normalized_email(payload.email)
    if len(name) < 2 or not valid_email(email) or len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Enter your name, a valid email, and a password with at least 8 characters.")
    if email in users:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac("sha256", payload.password.encode(), salt, 310000)
    users[email] = {"name": name, "salt": salt, "password_hash": password_hash}
    return {"success": True, "user": {"name": name, "email": email}, "message": "Account created. You can now sign in."}


@app.post("/api/login")
async def login(payload: LoginRequest) -> dict:
    email = normalized_email(payload.email)
    user = users.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    attempted_hash = hashlib.pbkdf2_hmac("sha256", payload.password.encode(), user["salt"], 310000)
    if not hmac.compare_digest(user["password_hash"], attempted_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return {"success": True, "user": {"name": user["name"], "email": email}, "message": "Signed in successfully."}


@app.post("/api/orders", status_code=201)
async def create_order(payload: CreateOrderRequest) -> dict:
    items = [item.model_dump() for item in payload.items]
    order_code = f"MBJ-{secrets.token_hex(4).upper()}"
    order = {
        "orderCode": order_code,
        "customer": payload.customer.strip()[:100] or "Guest",
        "email": payload.email.strip()[:254],
        "status": "Confirmed",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "items": items,
        "total": sum(item["price"] * item["quantity"] for item in items),
    }
    orders[order_code] = order
    return {"success": True, "order": order}


def find_order(order_code: str) -> dict:
    order = orders.get(order_code)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return {"success": True, "order": order, **order}


@app.get("/api/orders/{order_code}")
async def get_order(order_code: str) -> dict:
    return find_order(order_code)


@app.get("/api/order")
async def get_order_legacy(code: str) -> dict:
    return find_order(code)


@app.get("/", include_in_schema=False)
async def index() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


app.mount("/", StaticFiles(directory=BASE_DIR, html=True), name="static")
