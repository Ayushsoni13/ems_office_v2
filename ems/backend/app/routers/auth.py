from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import verify_password, create_token, get_current_user, hash_password
from app.models.models import User, RoleEnum
from datetime import datetime
from typing import Optional

router = APIRouter()

class LoginIn(BaseModel):
    email: str
    password: str

class RegisterIn(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"
    department: str = "General"
    position: str = "Employee"
    color: str = "blue"

def user_dict(u: User):
    return {
        "id": u.id, "name": u.name, "email": u.email,
        "role": u.role, "department": u.department, "position": u.position,
        "initials": u.initials, "color": u.color, "is_active": u.is_active,
        "joined": u.joined.isoformat() if u.joined else None,
        "last_login": u.last_login.isoformat() if u.last_login else None,
    }

@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_pw):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account deactivated. Contact admin.")
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user_dict(user)}

@router.post("/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(400, "Email already registered")
    initials = "".join(w[0].upper() for w in data.name.split()[:2])
    user = User(
        name=data.name, email=data.email.lower(),
        hashed_pw=hash_password(data.password),
        role=data.role, department=data.department,
        position=data.position, initials=initials, color=data.color
    )
    db.add(user); db.commit(); db.refresh(user)
    return user_dict(user)

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_dict(user)
