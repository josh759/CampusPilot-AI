import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CourseCreate(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=160)


class CourseUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=32)
    name: str | None = Field(default=None, min_length=1, max_length=160)


class CourseRead(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


AssignmentStatus = Literal["not_started", "in_progress", "completed"]


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    due_at: datetime
    course_id: uuid.UUID
    status: AssignmentStatus = "not_started"


class AssignmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    due_at: datetime | None = None
    course_id: uuid.UUID | None = None
    status: AssignmentStatus | None = None


class AssignmentRead(BaseModel):
    id: uuid.UUID
    title: str
    due_at: datetime
    status: AssignmentStatus
    course_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)