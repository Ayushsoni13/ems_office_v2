#!/usr/bin/env python3
"""
Run this ONCE to populate the database with demo data.
  cd backend && python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.models import Base, User, Task, Comment, TimeLog, Meeting, Attendee, Notification
from app.core.security import hash_password
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("🗑  Clearing old data...")
for M in [TimeLog,Comment,Notification,Attendee,Meeting,Task,User]:
    db.query(M).delete()
db.commit()

PW = hash_password("password123")

def mk_user(name, email, role, dept, pos, color):
    ini = "".join(w[0].upper() for w in name.split()[:2])
    return User(name=name, email=email, hashed_pw=PW, role=role,
                department=dept, position=pos, initials=ini, color=color,
                joined=datetime.utcnow()-timedelta(days=random.randint(100,600)))

print("👤 Creating users...")
boss    = mk_user("Diana Chen",     "boss@ems.com",      "boss",     "Executive",   "Chief Director",     "purple")
mgr1    = mk_user("James Lee",      "manager@ems.com",   "manager",  "Engineering", "Engineering Manager","orange")
mgr2    = mk_user("Priya Sharma",   "manager2@ems.com",  "manager",  "Design",      "Design Manager",     "pink")
sarah   = mk_user("Sarah Mitchell", "sarah@ems.com",     "employee", "Engineering", "Senior Developer",   "blue")
alex    = mk_user("Alex Kumar",     "alex@ems.com",      "employee", "Engineering", "Backend Developer",  "green")
maya    = mk_user("Maya Nair",      "maya@ems.com",      "employee", "Design",      "UI Designer",        "pink")
raj     = mk_user("Raj Patel",      "raj@ems.com",       "employee", "Engineering", "Frontend Developer", "teal")
zoe     = mk_user("Zoe Williams",   "zoe@ems.com",       "employee", "QA",          "QA Engineer",        "amber")
liam    = mk_user("Liam Torres",    "liam@ems.com",      "employee", "Product",     "Product Analyst",    "coral")
neha    = mk_user("Neha Gupta",     "neha@ems.com",      "employee", "Marketing",   "Marketing Analyst",  "red")

all_users = [boss, mgr1, mgr2, sarah, alex, maya, raj, zoe, liam, neha]
for u in all_users: db.add(u)
db.commit()
for u in all_users: db.refresh(u)

now = datetime.utcnow()
print("📋 Creating tasks...")

TASKS = [
  # (title, desc, priority, dept, creator, assignee, deadline_offset_days, est_hrs, progress, status, completed)
  ("API Integration — Payment Gateway","Integrate Stripe v3 with full webhook handling, refund flows and error recovery","critical","Engineering",mgr1,sarah,-1,12,65,"in_progress",False),
  ("UI Redesign — Dashboard v3","Redesign main dashboard using new design system. Mobile-first approach","high","Design",mgr2,maya,4,16,40,"in_progress",False),
  ("Database Migration Script","Migrate all legacy PostgreSQL tables to new normalised schema","high","Engineering",mgr1,alex,-3,6,100,"completed",True),
  ("Security Audit — All Endpoints","Full penetration test of backend APIs. Fix all critical findings","critical","Engineering",mgr1,alex,3,20,20,"in_progress",False),
  ("Mobile Responsive Fixes","Fix layout issues on iOS Safari and Android Chrome (tickets #88-#104)","medium","Engineering",mgr1,raj,6,4,80,"in_progress",False),
  ("Write API Documentation","Full Swagger + Postman collection for all v2 endpoints","medium","Engineering",mgr1,sarah,8,8,50,"in_progress",False),
  ("Performance Testing Suite","Load test all critical endpoints with k6. Target: 1000 req/s","high","QA",mgr1,zoe,-5,10,100,"completed",True),
  ("Customer Onboarding Wizard","Multi-step onboarding flow for B2B customers with progress tracking","high","Product",mgr2,liam,9,14,30,"in_progress",False),
  ("Fix Login Race Condition","Fix session collision bug on concurrent logins (issue #472)","high","Engineering",mgr1,raj,-6,3,100,"completed",True),
  ("Dark Mode Implementation","Add system-aware dark mode across all pages","low","Design",mgr2,maya,14,8,0,"pending",False),
  ("Setup CI/CD Pipeline","GitHub Actions: lint → test → build → deploy to staging on merge","high","Engineering",mgr1,alex,7,6,60,"in_progress",False),
  ("Q2 Report Design Templates","Create branded Keynote/PDF templates for Q2 investor report","medium","Design",mgr2,maya,-8,4,100,"completed",True),
  ("Marketing Campaign Assets","Design social media assets for July product launch","medium","Marketing",mgr2,neha,10,6,25,"in_progress",False),
  ("Unit Test Coverage","Raise unit test coverage from 42% to 80% across all modules","high","Engineering",mgr1,sarah,12,10,45,"in_progress",False),
  ("Accessibility Audit","WCAG 2.1 AA compliance review and fixes across entire frontend","medium","Design",mgr2,raj,15,8,0,"pending",False),
  ("Email Notification Service","Build transactional email service using SendGrid","high","Engineering",mgr1,alex,-4,5,100,"completed",True),
  ("Analytics Dashboard","Build real-time analytics charts for product metrics","high","Product",mgr2,liam,11,12,15,"in_progress",False),
  ("Onboarding Video Script","Write and record screen-capture tutorial videos for new users","low","Product",mgr2,liam,20,4,0,"pending",False),
  ("Load Balancer Config","Configure Nginx load balancer for the new 3-node cluster","critical","Engineering",mgr1,raj,-2,4,100,"completed",True),
  ("Code Review Guidelines","Write internal code review standards document","low","Engineering",mgr1,sarah,18,3,70,"in_progress",False),
]

created_tasks = []
for (title,desc,prio,dept,creator,assignee,dd_off,est,prog,status,done) in TASKS:
    deadline = now + timedelta(days=dd_off)
    completed_at = None
    if done:
        completed_at = deadline - timedelta(hours=random.randint(1,6))
        if random.random() < 0.2:   # 20% completed late
            completed_at = deadline + timedelta(hours=random.randint(1,3))
    t = Task(title=title, description=desc, priority=prio, department=dept,
             deadline=deadline, est_hours=est, progress=prog, status=status,
             creator_id=creator.id, assignee_id=assignee.id,
             actual_hours=round(est*prog/100*0.9,1),
             completed_at=completed_at,
             notes="Please update progress daily and flag blockers immediately.",
             created_at=now-timedelta(days=random.randint(2,20)))
    db.add(t)
    created_tasks.append(t)
db.commit()
for t in created_tasks: db.refresh(t)

print("💬 Creating comments...")
COMMENTS = [
  (0,mgr1,"Please use Stripe v3 SDK. Handle all edge cases including partial failures."),
  (0,sarah,"Set up sandbox environment. Testing card flows now. Will update by EOD."),
  (0,mgr1,"Good progress! Also add idempotency keys to prevent duplicate charges."),
  (0,sarah,"Idempotency keys done. Webhook validation also complete. 65% done now."),
  (1,mgr2,"Use the new Figma design tokens. Mobile-first, then desktop breakpoints."),
  (1,maya,"Mockups done and shared in Figma. Waiting for your review."),
  (1,mgr2,"Approved the core layout. Please refine the sidebar component."),
  (3,mgr1,"Focus on authentication endpoints first. Then data validation layer."),
  (3,alex,"Found SQL injection vector in the search endpoint. Patching now."),
  (3,alex,"Also found exposed internal error messages. Fixed in PR #88."),
  (4,mgr1,"Use the responsive utility classes from our shared CSS lib."),
  (4,raj,"80% done. Just Safari date picker issues left."),
  (5,sarah,"Starting with the auth endpoints. Should have first draft by tomorrow."),
  (10,mgr1,"This is low priority but will improve developer experience significantly."),
  (13,sarah,"Added tests for auth module (coverage 78%). Working on task module now."),
]
for (ti, author, body) in COMMENTS:
    t = created_tasks[ti]
    db.add(Comment(body=body, task_id=t.id, author_id=author.id,
                   created_at=now-timedelta(hours=random.randint(1,72))))
db.commit()

print("⏱  Creating time logs...")
employees = [sarah, alex, maya, raj, zoe, liam, neha]
for u in employees:
    for t in created_tasks:
        if t.assignee_id == u.id and t.progress > 0:
            for day_offset in range(min(5, int(t.progress/20)+1)):
                secs = random.randint(2700, 7200)
                db.add(TimeLog(seconds=secs, user_id=u.id, task_id=t.id,
                               note=f"Working on {t.title}",
                               logged_at=now-timedelta(days=day_offset, hours=random.randint(0,5))))
db.commit()

print("📅 Creating meetings...")
MEETINGS = [
  ("Sprint Review Q2","Demo completed features, velocity analysis, and retrospective","sprint","Room 3B",None,now+timedelta(hours=1),60,[sarah.id,alex.id, maya.id,raj.id,zoe.id]),
  ("Design Weekly Sync","Review UI mockups, give feedback, align on priorities","sync","Google Meet","https://meet.google.com/abc-defg-hij",now+timedelta(hours=4),30,[maya.id,liam.id,mgr2.id]),
  ("Q2 Planning Session","Roadmap planning, OKR review, resource allocation","planning","Boardroom A",None,now+timedelta(days=2,hours=2),90,[sarah.id,alex.id,maya.id,raj.id,zoe.id,liam.id,neha.id]),
  ("1-on-1 James & Sarah","Performance review, career goals, blockers","1on1","Manager cabin",None,now+timedelta(days=3),30,[sarah.id]),
  ("All Hands — April","Company-wide update, celebrations, Q2 preview","allhands","Main Hall",None,now+timedelta(days=5),60,[sarah.id,alex.id,maya.id,raj.id,zoe.id,liam.id,neha.id]),
  ("Security Debrief","Review audit findings, prioritise fixes","review","Room 2A",None,now+timedelta(days=1,hours=3),45,[alex.id,raj.id]),
  ("Product Roadmap Review","Review H2 roadmap with stakeholders","planning","Room 1B",None,now+timedelta(days=7),60,[liam.id,sarah.id,neha.id]),
]
for row in MEETINGS:
    title,desc,mtype,loc,link,sched,dur,att_ids = row
    m = Meeting(title=title,description=desc,mtype=mtype,location=loc,link=link,
                scheduled_at=sched,duration_min=dur,creator_id=mgr1.id)
    db.add(m); db.flush()
    for uid in att_ids:
        db.add(Attendee(meeting_id=m.id,user_id=uid))
        db.add(Notification(user_id=uid,title=f"📅 {title}",
                            body=f"Scheduled {sched.strftime('%b %d at %I:%M %p')}. by {mgr1.name}",
                            ntype="meeting",ref_id=m.id,ref_type="meeting"))
db.commit()

print("🔔 Creating notifications...")
for t in created_tasks:
    if t.assignee_id:
        db.add(Notification(user_id=t.assignee_id,
                            title=f"📋 Task Assigned: {t.title}",
                            body=f"Priority: {t.priority}. Deadline: {t.deadline.strftime('%b %d') if t.deadline else 'N/A'}",
                            ntype="task",ref_id=t.id,ref_type="task",
                            created_at=t.created_at))
# Deadline reminders
for t in created_tasks:
    if t.assignee_id and t.deadline and 0 <= (t.deadline-now).days <= 2 and t.status!="completed":
        db.add(Notification(user_id=t.assignee_id,
                            title=f"⏰ Deadline Soon: {t.title}",
                            body=f"Due {t.deadline.strftime('%b %d')}. Current progress: {t.progress}%",
                            ntype="reminder",ref_id=t.id,ref_type="task"))
db.commit()
db.close()

print("\n✅ Database seeded successfully!")
print("─" * 48)
print("  🔐 LOGIN CREDENTIALS (password: password123)")
print("─" * 48)
print("  Boss:      boss@ems.com")
print("  Manager:   manager@ems.com")
print("  Manager2:  manager2@ems.com")
print("  Employee:  sarah@ems.com")
print("  Employee:  alex@ems.com")
print("  Employee:  maya@ems.com")
print("  Employee:  raj@ems.com")
print("  Employee:  zoe@ems.com")
print("─" * 48)
