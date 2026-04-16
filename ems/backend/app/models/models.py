from sqlalchemy import (Column, Integer, String, Boolean, DateTime, Text,
                        Float, ForeignKey, Enum as SAEnum)
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class RoleEnum(str, enum.Enum):
    boss = "boss"
    manager = "manager"
    employee = "employee"

class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class StatusEnum(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    review = "review"
    completed = "completed"

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(150), nullable=False)
    email         = Column(String(200), unique=True, index=True, nullable=False)
    hashed_pw     = Column(String(300), nullable=False)
    role          = Column(SAEnum(RoleEnum), default=RoleEnum.employee)
    department    = Column(String(100), default="General")
    position      = Column(String(150), default="Employee")
    initials      = Column(String(4),   default="EM")
    color         = Column(String(20),  default="blue")
    is_active     = Column(Boolean, default=True)
    joined        = Column(DateTime, default=datetime.utcnow)
    last_login    = Column(DateTime, nullable=True)

    tasks_assigned = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")
    tasks_created  = relationship("Task", foreign_keys="Task.creator_id",  back_populates="creator")
    comments       = relationship("Comment", back_populates="author")
    time_logs      = relationship("TimeLog",  back_populates="user")
    notifications  = relationship("Notification", back_populates="user")
    meeting_slots  = relationship("Attendee", back_populates="user")

class Task(Base):
    __tablename__ = "tasks"
    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(300), nullable=False)
    description   = Column(Text,        nullable=True)
    priority      = Column(SAEnum(PriorityEnum), default=PriorityEnum.medium)
    status        = Column(SAEnum(StatusEnum),   default=StatusEnum.pending)
    progress      = Column(Integer, default=0)
    department    = Column(String(100), default="General")
    deadline      = Column(DateTime, nullable=True)
    est_hours     = Column(Float, default=0)
    actual_hours  = Column(Float, default=0)
    notes         = Column(Text, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at  = Column(DateTime, nullable=True)
    assignee_id   = Column(Integer, ForeignKey("users.id"), nullable=True)
    creator_id    = Column(Integer, ForeignKey("users.id"), nullable=False)

    assignee  = relationship("User", foreign_keys=[assignee_id], back_populates="tasks_assigned")
    creator   = relationship("User", foreign_keys=[creator_id],  back_populates="tasks_created")
    comments  = relationship("Comment",  back_populates="task",  cascade="all, delete-orphan")
    time_logs = relationship("TimeLog",  back_populates="task",  cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    id         = Column(Integer, primary_key=True, index=True)
    body       = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    task_id    = Column(Integer, ForeignKey("tasks.id"))
    author_id  = Column(Integer, ForeignKey("users.id"))
    task       = relationship("Task",    back_populates="comments")
    author     = relationship("User",    back_populates="comments")

class TimeLog(Base):
    __tablename__ = "time_logs"
    id         = Column(Integer, primary_key=True, index=True)
    seconds    = Column(Integer, default=0)
    note       = Column(String(300), nullable=True)
    logged_at  = Column(DateTime, default=datetime.utcnow)
    task_id    = Column(Integer, ForeignKey("tasks.id"))
    user_id    = Column(Integer, ForeignKey("users.id"))
    task       = relationship("Task", back_populates="time_logs")
    user       = relationship("User", back_populates="time_logs")

class Meeting(Base):
    __tablename__ = "meetings"
    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(300), nullable=False)
    description  = Column(Text, nullable=True)
    mtype        = Column(String(60), default="general")
    location     = Column(String(200), nullable=True)
    link         = Column(String(500), nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    duration_min = Column(Integer, default=60)
    creator_id   = Column(Integer, ForeignKey("users.id"))
    created_at   = Column(DateTime, default=datetime.utcnow)
    attendees    = relationship("Attendee", back_populates="meeting", cascade="all, delete-orphan")

class Attendee(Base):
    __tablename__ = "attendees"
    id         = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    user_id    = Column(Integer, ForeignKey("users.id"))
    meeting    = relationship("Meeting", back_populates="attendees")
    user       = relationship("User",    back_populates="meeting_slots")

class Notification(Base):
    __tablename__ = "notifications"
    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(300), nullable=False)
    body         = Column(Text, nullable=True)
    ntype        = Column(String(50), default="info")
    is_read      = Column(Boolean, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)
    user_id      = Column(Integer, ForeignKey("users.id"))
    ref_id       = Column(Integer, nullable=True)
    ref_type     = Column(String(50), nullable=True)
    user         = relationship("User", back_populates="notifications")
