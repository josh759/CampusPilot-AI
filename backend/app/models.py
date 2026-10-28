import uuid
from datetime import datetime, time

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, Time, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    courses: Mapped[list["Course"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    schedule_items: Mapped[list["ScheduleItem"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    study_conversations: Mapped[list["StudyConversation"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        UniqueConstraint("user_id", "code", name="uq_courses_user_id_code"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="courses")
    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
    )
    schedule_items: Mapped[list["ScheduleItem"]] = relationship(
        back_populates="course",
        passive_deletes=True,
    )
    study_conversations: Mapped[list["StudyConversation"]] = relationship(
        back_populates="course",
        passive_deletes=True,
    )


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        default="not_started",
        server_default="not_started",
        nullable=False,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("courses.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    course: Mapped["Course"] = relationship(back_populates="assignments")


class ScheduleItem(Base):
    __tablename__ = "schedule_items"
    __table_args__ = (
        CheckConstraint(
            "weekday >= 0 AND weekday <= 6",
            name="ck_schedule_items_weekday",
        ),
        CheckConstraint(
            "end_time > start_time",
            name="ck_schedule_items_end_after_start",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("courses.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="schedule_items")
    course: Mapped["Course | None"] = relationship(back_populates="schedule_items")

class StudyConversation(Base):
    __tablename__ = "study_conversations"
    __table_args__ = (
        Index("ix_study_conversations_user_id_updated_at", "user_id", "updated_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    course_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("courses.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="study_conversations")
    course: Mapped["Course | None"] = relationship(back_populates="study_conversations")
    messages: Mapped[list["StudyMessage"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="StudyMessage.created_at",
    )


class StudyMessage(Base):
    __tablename__ = "study_messages"
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant')",
            name="ck_study_messages_role",
        ),
        Index(
            "ix_study_messages_conversation_id_created_at",
            "conversation_id",
            "created_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("study_conversations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    conversation: Mapped["StudyConversation"] = relationship(back_populates="messages")
