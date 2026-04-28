import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.settings import Settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# In-memory token store (single user, cleared on restart)
active_tokens: set[str] = set()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def require_auth(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")
    token = authorization[7:]
    if token not in active_tokens:
        raise HTTPException(status_code=401, detail="未登录")
    return token


class LoginRequest(BaseModel):
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=1)


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    setting = db.query(Settings).filter(Settings.key == "password").first()
    if not setting or setting.value != hash_password(data.password):
        raise HTTPException(status_code=401, detail="密码错误")
    token = secrets.token_hex(32)
    active_tokens.add(token)
    return {"token": token}


@router.get("/verify")
def verify(token: str = Depends(require_auth)):
    return {"ok": True}


@router.post("/change-password")
def change_password(data: ChangePasswordRequest, token: str = Depends(require_auth), db: Session = Depends(get_db)):
    setting = db.query(Settings).filter(Settings.key == "password").first()
    if not setting or setting.value != hash_password(data.old_password):
        raise HTTPException(status_code=401, detail="原密码错误")
    setting.value = hash_password(data.new_password)
    db.commit()
    return {"ok": True}
