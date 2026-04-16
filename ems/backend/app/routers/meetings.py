from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Meeting, Attendee, Notification
from datetime import datetime

router = APIRouter()

class MeetingIn(BaseModel):
    title: str
    description: Optional[str] = None
    mtype: str = "general"
    location: Optional[str] = None
    link: Optional[str] = None
    scheduled_at: str
    duration_min: int = 60
    attendee_ids: List[int] = []

def mdict(m, db):
    atts = [{"id":a.user.id,"name":a.user.name,"initials":a.user.initials,"color":a.user.color}
            for a in m.attendees]
    return {"id":m.id,"title":m.title,"description":m.description,"mtype":m.mtype,
            "location":m.location,"link":m.link,
            "scheduled_at":m.scheduled_at.isoformat(),
            "duration_min":m.duration_min,"attendees":atts,
            "creator_id":m.creator_id}

@router.get("/")
def list_meetings(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    if cu.role in ("boss","manager"):
        meetings = db.query(Meeting).order_by(Meeting.scheduled_at).all()
    else:
        ids = [a.meeting_id for a in db.query(Attendee).filter(Attendee.user_id==cu.id).all()]
        meetings = db.query(Meeting).filter(Meeting.id.in_(ids)).order_by(Meeting.scheduled_at).all()
    return [mdict(m,db) for m in meetings]

@router.post("/")
def create_meeting(data: MeetingIn, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    if cu.role=="employee": raise HTTPException(403)
    scheduled = datetime.fromisoformat(data.scheduled_at)
    m = Meeting(title=data.title,description=data.description,mtype=data.mtype,
                location=data.location,link=data.link,scheduled_at=scheduled,
                duration_min=data.duration_min,creator_id=cu.id)
    db.add(m); db.flush()
    for uid in data.attendee_ids:
        db.add(Attendee(meeting_id=m.id,user_id=uid))
        db.add(Notification(user_id=uid,title=f"📅 Meeting: {data.title}",
                             body=f"Scheduled {scheduled.strftime('%b %d at %I:%M %p')} by {cu.name}",
                             ntype="meeting",ref_id=m.id,ref_type="meeting"))
    db.commit(); db.refresh(m)
    return mdict(m,db)

@router.delete("/{mid}")
def del_meeting(mid: int, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    if cu.role=="employee": raise HTTPException(403)
    m = db.query(Meeting).filter(Meeting.id==mid).first()
    if not m: raise HTTPException(404)
    db.delete(m); db.commit()
    return {"ok":True}
