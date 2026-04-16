from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Task, Meeting, Notification, TimeLog
from datetime import datetime, timedelta

# ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
notif_router = APIRouter()

def ndict(n):
    return {"id":n.id,"title":n.title,"body":n.body,"ntype":n.ntype,
            "is_read":n.is_read,"created_at":n.created_at.isoformat(),
            "ref_id":n.ref_id,"ref_type":n.ref_type}

@notif_router.get("/")
def list_notifs(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    return [ndict(n) for n in
            db.query(Notification).filter(Notification.user_id==cu.id)
            .order_by(Notification.created_at.desc()).limit(50).all()]

@notif_router.get("/count")
def notif_count(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    return {"unread": db.query(Notification).filter(Notification.user_id==cu.id, Notification.is_read==False).count()}

@notif_router.put("/{nid}/read")
def mark_read(nid: int, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id==nid, Notification.user_id==cu.id).first()
    if n: n.is_read=True; db.commit()
    return {"ok":True}

@notif_router.put("/read-all")
def read_all(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id==cu.id, Notification.is_read==False).update({"is_read":True})
    db.commit()
    return {"ok":True}

# ─── DASHBOARD ────────────────────────────────────────────────────────────────
dash_router = APIRouter()

def weekly_completions(db, now, extra_filter=None):
    data = []
    for i in range(6,-1,-1):
        d = now - timedelta(days=i)
        s,e = d.replace(hour=0,minute=0,second=0),d.replace(hour=23,minute=59,second=59)
        q = db.query(Task).filter(Task.completed_at>=s, Task.completed_at<=e)
        if extra_filter is not None: q = q.filter(extra_filter)
        data.append({"day":d.strftime("%a"),"count":q.count()})
    return data

@dash_router.get("/boss")
def boss_dash(db: Session = Depends(get_db), _=Depends(get_current_user)):
    now = datetime.utcnow()
    all_tasks = db.query(Task).all()
    all_users = db.query(User).filter(User.is_active==True).all()
    total=len(all_tasks); completed=sum(1 for t in all_tasks if t.status=="completed")
    overdue=sum(1 for t in all_tasks if t.deadline and t.deadline<now and t.status!="completed")
    in_prog=sum(1 for t in all_tasks if t.status=="in_progress")
    # dept breakdown
    dept={}
    for t in all_tasks:
        d=t.department; dept.setdefault(d,{"dept":d,"total":0,"completed":0})
        dept[d]["total"]+=1
        if t.status=="completed": dept[d]["completed"]+=1
    # priority chart
    prio={}
    for t in all_tasks: prio[t.priority]=prio.get(t.priority,0)+1
    # top performers
    top=[]
    for u in [x for x in all_users if x.role=="employee"]:
        tasks=[t for t in all_tasks if t.assignee_id==u.id]
        c=sum(1 for t in tasks if t.status=="completed"); tot=len(tasks)
        ot=sum(1 for t in tasks if t.completed_at and t.deadline and t.completed_at<=t.deadline)
        score=round((ot/max(c,1)*55)+(c/max(tot,1)*35),1)
        top.append({"id":u.id,"name":u.name,"department":u.department,
                    "initials":u.initials,"color":u.color,
                    "score":min(score,100),"completed":c,"total":tot})
    top.sort(key=lambda x:x["score"],reverse=True)
    return {
        "total_employees":len(all_users),"managers":sum(1 for u in all_users if u.role=="manager"),
        "employees":sum(1 for u in all_users if u.role=="employee"),
        "total_tasks":total,"completed_tasks":completed,"overdue_tasks":overdue,"in_progress":in_prog,
        "completion_rate":round(completed/max(total,1)*100,1),
        "dept_breakdown":list(dept.values()),
        "weekly_completions":weekly_completions(db,now),
        "priority_dist":[{"name":k,"value":v} for k,v in prio.items()],
        "top_performers":top[:6],
        "upcoming_meetings":db.query(Meeting).filter(Meeting.scheduled_at>=now).count(),
    }

@dash_router.get("/manager")
def manager_dash(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    now = datetime.utcnow()
    tasks = db.query(Task).filter(Task.creator_id==cu.id).all()
    team_ids = list({t.assignee_id for t in tasks if t.assignee_id})
    team = db.query(User).filter(User.id.in_(team_ids)).all()
    stats = []
    for u in team:
        ut=[t for t in tasks if t.assignee_id==u.id]
        stats.append({"id":u.id,"name":u.name,"initials":u.initials,"color":u.color,"department":u.department,
                      "total":len(ut),"completed":sum(1 for t in ut if t.status=="completed"),
                      "overdue":sum(1 for t in ut if t.deadline and t.deadline<now and t.status!="completed"),
                      "in_progress":sum(1 for t in ut if t.status=="in_progress")})
    total=len(tasks); completed=sum(1 for t in tasks if t.status=="completed")
    return {
        "total_tasks":total,"completed":completed,
        "overdue":sum(1 for t in tasks if t.deadline and t.deadline<now and t.status!="completed"),
        "in_progress":sum(1 for t in tasks if t.status=="in_progress"),
        "team_size":len(team),"member_stats":stats,
        "weekly_completions":weekly_completions(db,now,Task.creator_id==cu.id),
        "completion_rate":round(completed/max(total,1)*100,1),
    }

@dash_router.get("/employee")
def employee_dash(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    now = datetime.utcnow()
    tasks = db.query(Task).filter(Task.assignee_id==cu.id).all()
    total=len(tasks); completed=sum(1 for t in tasks if t.status=="completed")
    overdue=sum(1 for t in tasks if t.deadline and t.deadline<now and t.status!="completed")
    on_time=sum(1 for t in tasks if t.completed_at and t.deadline and t.completed_at<=t.deadline)
    secs=(db.query(func.sum(TimeLog.seconds)).filter(TimeLog.user_id==cu.id).scalar() or 0)
    weekly=[]
    for i in range(6,-1,-1):
        d=now-timedelta(days=i); s,e=d.replace(hour=0,minute=0,second=0),d.replace(hour=23,minute=59,second=59)
        sec=db.query(func.sum(TimeLog.seconds)).filter(TimeLog.user_id==cu.id,TimeLog.logged_at>=s,TimeLog.logged_at<=e).scalar() or 0
        weekly.append({"day":d.strftime("%a"),"hours":round(sec/3600,1)})
    return {
        "total":total,"completed":completed,"overdue":overdue,
        "in_progress":sum(1 for t in tasks if t.status=="in_progress"),
        "pending":sum(1 for t in tasks if t.status=="pending"),
        "hours_logged":round(secs/3600,1),
        "on_time_rate":round(on_time/max(completed,1)*100,1),
        "completion_rate":round(completed/max(total,1)*100,1),
        "weekly_hours":weekly,
    }
