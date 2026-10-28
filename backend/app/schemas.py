import uuid
from datetime import datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


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


def _check_time_range(start_time: time, end_time: time | None) -> None:
    if end_time is not None and end_time <= start_time:
        raise ValueError("end_time must be later than start_time")


class ScheduleItemBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    location: str | None = Field(default=None, max_length=255)
    course_id: uuid.UUID | None = None


class ScheduleItemCreate(ScheduleItemBase):
    @model_validator(mode="after")
    def end_after_start(self) -> "ScheduleItemCreate":
        _check_time_range(self.start_time, self.end_time)
        return self


class ScheduleItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    weekday: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    location: str | None = Field(default=None, max_length=255)
    course_id: uuid.UUID | None = None

    # Only validates when both times are present in the same request;
    # the route re-checks the merged result against the stored row.
    @model_validator(mode="after")
    def end_after_start(self) -> "ScheduleItemUpdate":
        if self.start_time is not None:
            _check_time_range(self.start_time, self.end_time)
        return self


class ScheduleItemRead(BaseModel):
    id: uuid.UUID
    title: str
    weekday: int
    start_time: time
    end_time: time
    location: str | None
    course_id: uuid.UUID | None
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudyAssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    course_id: uuid.UUID | None = None

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message must not be blank")
        return value


class StudyAssistantChatResponse(BaseModel):
    answer: str
    course_id: uuid.UUID | None = None


class StudyConversationCreate(BaseModel):
    course_id: uuid.UUID | None = None
    title: str | None = Field(default=None, max_length=120)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return " ".join(value.split()) or None


class StudyConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    course_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class StudyMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class StudyConversationDetail(StudyConversationSummary):
    messages: list[StudyMessageRead]


class StudyMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message must not be blank")
        return value


class StudyMessageExchange(BaseModel):
    user_message: StudyMessageRead
    assistant_message: StudyMessageRead
    conversation: StudyConversationSummary
