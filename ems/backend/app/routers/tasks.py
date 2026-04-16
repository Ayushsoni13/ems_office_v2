from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Task, Comment, TimeLog, Notification
from datetime import datetime

router = APIRouter()

def notify(db, user_id, title, body, ntype="task", ref_id=None, ref_type=None):
    db.add(Notification(user_id=user_id,title=title,body=body,ntype=ntype,ref_id=ref_id,ref_type=ref_type))

def tdict(t):
    return {
        "id":t.id,"title":t.title,"description":t.description,
        "priority":t.priority,"status":t.status,"progress":t.progress,
        "department":t.department,"deadline":t.deadline.isoformat() if t.deadline else None,
        "est_hours":t.est_hours,"actual_hours":t.actual_hours,"notes":t.notes,
        "created_at":t.created_at.isoformat(),"updated_at":t.updated_at.isoformat() if t.updated_at else None,
        "completed_at":t.completed_at.isoformat() if t.completed_at else None,
        "assignee":{"id":t.assignee.id,"name":t.assignee.name,"initials":t.assignee.initials,"color":t.assignee.color,"department":t.assignee.department} if t.assignee else None,
        "creator":{"id":t.creator.id,"name":t.creator.name,"initials":t.creator.initials,"color":t.creator.color} if t.creator else None,
        "comments":[{"id":c.id,"body":c.body,"created_at":c.created_at.isoformat(),
                     "author":{"id":c.author.id,"name":c.author.name,"initials":c.author.initials,"color":c.author.color}} for c in t.comments],
        "time_logs":[{"id":l.id,"seconds":l.seconds,"note":l.note,"logged_at":l.logged_at.isoformat(),
                      "user":{"id":l.user.id,"name":l.user.name,"initials":l.user.initials}} for l in t.time_logs],
    }

class TaskIn(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    department: str = "General"
    deadline: Optional[str] = None
    est_hours: float = 0
    notes: Optional[str] = None
    assignee_id: Optional[int] = None

class TaskPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    department: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    assignee_id: Optional[int] = None

class CommentIn(BaseModel):
    body: str

class TimeIn(BaseModel):
    seconds: int
    note: Optional[str] = None

@router.get("/")
def list_tasks(
    assignee_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user)
):
    q = db.query(Task)
    if cu.role == "employee":
        q = q.filter(Task.assignee_id==cu.id)
    else:
        if assignee_id: q = q.filter(Task.assignee_id==assignee_id)
    if status:     q = q.filter(Task.status==status)
    if priority:   q = q.filter(Task.priority==priority)
    if department: q = q.filter(Task.department==department)
    return [tdict(t) for t in q.order_by(Task.created_at.desc()).all()]

@router.post("/")
def create_task(data: TaskIn, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    if cu.role == "employee": raise HTTPException(403,"Not allowed")
    deadline = datetime.fromisoformat(data.deadline) if data.deadline else None
    t = Task(title=data.title,description=data.description,priority=data.priority,
             department=data.department,deadline=deadline,est_hours=data.est_hours,
             notes=data.notes,assignee_id=data.assignee_id,creator_id=cu.id)
    db.add(t); db.flush()
    if data.assignee_id:
        notify(db,data.assignee_id,f"New Task: {data.title}",
               f"Assigned by {cu.name}. Priority: {data.priority}. Deadline: {data.deadline or 'N/A'}",
               "task",t.id,"task")
    db.commit(); db.refresh(t)
    return tdict(t)

@router.get("/{tid}")
def get_task(tid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    t = db.query(Task).filter(Task.id==tid).first()
    if not t: raise HTTPException(404)
    return tdict(t)

@router.patch("/{tid}")
def patch_task(tid: int, data: TaskPatch, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    t = db.query(Task).filter(Task.id==tid).first()
    if not t: raise HTTPException(404)
    old_status = t.status
    if data.deadline: t.deadline = datetime.fromisoformat(data.deadline)
    for k,v in data.dict(exclude_none=True, exclude={"deadline"}).items():
        setattr(t,k,v)
    t.updated_at = datetime.utcnow()
    # If completed now
    if data.status == "completed" and old_status != "completed":
        t.completed_at = datetime.utcnow()
        t.progress = 100
        if t.creator_id and t.creator_id != cu.id:
            notify(db,t.creator_id,f"✅ Task Completed: {t.title}",
                   f"Completed by {cu.name}","task",t.id,"task")
    # Progress update notification to manager
    if data.progress is not None and t.creator_id and t.creator_id != cu.id:
        notify(db,t.creator_id,f"📊 Progress Update: {t.title}",
               f"{cu.name} updated progress to {data.progress}%","task",t.id,"task")
    db.commit(); db.refresh(t)
    return tdict(t)

@router.delete("/{tid}")
def del_task(tid: int, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    if cu.role=="employee": raise HTTPException(403)
    t = db.query(Task).filter(Task.id==tid).first()
    if not t: raise HTTPException(404)
    db.delete(t); db.commit()
    return {"ok":True}

@router.post("/{tid}/comments")
def add_comment(tid: int, data: CommentIn, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    t = db.query(Task).filter(Task.id==tid).first()
    if not t: raise HTTPException(404)
    c = Comment(body=data.body, task_id=tid, author_id=cu.id)
    db.add(c)
    notify_id = t.creator_id if cu.id==t.assignee_id else t.assignee_id
    if notify_id and notify_id!=cu.id:
        notify(db,notify_id,f"💬 Comment on: {t.title}",
               f"{cu.name}: {data.body[:100]}","comment",tid,"task")
    db.commit(); db.refresh(c)
    return {"id":c.id,"body":c.body,"created_at":c.created_at.isoformat(),
            "author":{"id":cu.id,"name":cu.name,"initials":cu.initials,"color":cu.color}}

@router.post("/{tid}/timelog")
def log_time(tid: int, data: TimeIn, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    t = db.query(Task).filter(Task.id==tid).first()
    if not t: raise HTTPException(404)
    log = TimeLog(seconds=data.seconds, note=data.note, task_id=tid, user_id=cu.id)
    db.add(log)
    t.actual_hours = round(t.actual_hours + data.seconds/3600, 2)
    db.commit(); db.refresh(log)
    return {"id":log.id,"seconds":log.seconds,"note":log.note,
            "logged_at":log.logged_at.isoformat()}
