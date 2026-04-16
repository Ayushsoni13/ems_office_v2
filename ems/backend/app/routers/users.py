from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user, hash_password
from app.models.models import User, Task, TimeLog
from datetime import datetime, timedelta

router = APIRouter()

class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class CreateUser(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"
    department: str = "General"
    position: str = "Employee"
    color: str = "blue"

def udict(u):
    return {"id":u.id,"name":u.name,"email":u.email,"role":u.role,
            "department":u.department,"position":u.position,
            "initials":u.initials,"color":u.color,"is_active":u.is_active,
            "joined":u.joined.isoformat() if u.joined else None}

@router.get("/")
def list_users(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [udict(u) for u in db.query(User).filter(User.is_active==True).all()]

@router.post("/")
def create_user(data: CreateUser, db: Session = Depends(get_db), cu=Depends(get_current_user)):
    if cu.role not in ("boss","manager"):
        raise HTTPException(403)
    if db.query(User).filter(User.email==data.email.lower()).first():
        raise HTTPException(400,"Email taken")
    initials = "".join(w[0].upper() for w in data.name.split()[:2])
    u = User(name=data.name,email=data.email.lower(),hashed_pw=hash_password(data.password),
             role=data.role,department=data.department,position=data.position,
             initials=initials,color=data.color)
    db.add(u); db.commit(); db.refresh(u)
    return udict(u)

@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db), _=Depends(get_current_user)):
    employees = db.query(User).filter(User.role=="employee", User.is_active==True).all()
    board = []
    now = datetime.utcnow()
    for u in employees:
        tasks = db.query(Task).filter(Task.assignee_id==u.id).all()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status=="completed")
        overdue = sum(1 for t in tasks if t.deadline and t.deadline<now and t.status!="completed")
        on_time = sum(1 for t in tasks if t.completed_at and t.deadline and t.completed_at<=t.deadline)
        comp_rate = round(completed/max(total,1)*100,1)
        ot_rate = round(on_time/max(completed,1)*100,1)
        score = round(ot_rate*0.55 + comp_rate*0.35 + max(0,10-overdue)*1,1)
        hrs = (db.query(func.sum(TimeLog.seconds)).filter(TimeLog.user_id==u.id).scalar() or 0)/3600
        board.append({"id":u.id,"name":u.name,"department":u.department,
                      "initials":u.initials,"color":u.color,
                      "total_tasks":total,"completed":completed,"overdue":overdue,
                      "on_time_rate":ot_rate,"completion_rate":comp_rate,
                      "hours_logged":round(hrs,1),"score":min(score,100)})
    board.sort(key=lambda x:x["score"],reverse=True)
    for i,b in enumerate(board): b["rank"]=i+1
    return board

@router.get("/employee-of-year")
def eoy(db: Session = Depends(get_db), _=Depends(get_current_user)):
    year_start = datetime(datetime.utcnow().year,1,1)
    employees = db.query(User).filter(User.role=="employee",User.is_active==True).all()
    best,best_score = None,-1
    for u in employees:
        tasks = db.query(Task).filter(Task.assignee_id==u.id,Task.created_at>=year_start).all()
        completed = sum(1 for t in tasks if t.status=="completed")
        on_time = sum(1 for t in tasks if t.completed_at and t.deadline and t.completed_at<=t.deadline)
        score = (on_time/max(completed,1)*70) + (completed*2)
        if score > best_score:
            best_score,best = score,u
    if not best: return None
    tasks = db.query(Task).filter(Task.assignee_id==best.id,Task.created_at>=year_start).all()
    completed = sum(1 for t in tasks if t.status=="completed")
    return {"id":best.id,"name":best.name,"department":best.department,
            "initials":best.initials,"color":best.color,
            "score":round(best_score,1),"completed_tasks":completed}

@router.get("/{uid}/stats")
def stats(uid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    u = db.query(User).filter(User.id==uid).first()
    if not u: raise HTTPException(404)
    tasks = db.query(Task).filter(Task.assignee_id==uid).all()
    now = datetime.utcnow()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status=="completed")
    overdue = sum(1 for t in tasks if t.deadline and t.deadline<now and t.status!="completed")
    in_prog = sum(1 for t in tasks if t.status=="in_progress")
    on_time = sum(1 for t in tasks if t.completed_at and t.deadline and t.completed_at<=t.deadline)
    hrs = (db.query(func.sum(TimeLog.seconds)).filter(TimeLog.user_id==uid).scalar() or 0)/3600
    weekly = []
    for i in range(6,-1,-1):
        d = now - timedelta(days=i)
        s,e = d.replace(hour=0,minute=0,second=0),d.replace(hour=23,minute=59,second=59)
        sec = db.query(func.sum(TimeLog.seconds)).filter(TimeLog.user_id==uid,TimeLog.logged_at>=s,TimeLog.logged_at<=e).scalar() or 0
        weekly.append({"day":d.strftime("%a"),"hours":round(sec/3600,1)})
    return {"total":total,"completed":completed,"overdue":overdue,"in_progress":in_prog,
            "on_time_rate":round(on_time/max(completed,1)*100,1),
            "completion_rate":round(completed/max(total,1)*100,1),
            "hours_logged":round(hrs,1),"weekly_hours":weekly}

@router.put("/{uid}")
def update_user(uid: int, data: UserUpdate, db: Session = Depends(get_db), cu=Depends(get_current_user)):
    if cu.id!=uid and cu.role not in ("boss","manager"):
        raise HTTPException(403)
    u = db.query(User).filter(User.id==uid).first()
    if not u: raise HTTPException(404)
    for k,v in data.dict(exclude_none=True).items():
        setattr(u,k,v)
    db.commit(); db.refresh(u)
    return udict(u)

@router.delete("/{uid}")
def deactivate(uid: int, db: Session = Depends(get_db), cu=Depends(get_current_user)):
    if cu.role not in ("boss","manager"): raise HTTPException(403)
    u = db.query(User).filter(User.id==uid).first()
    if not u: raise HTTPException(404)
    u.is_active = False
    db.commit()
    return {"ok":True}
