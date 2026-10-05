import uuid

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, DatabaseSession
from app.models import Course, ScheduleItem
from app.schemas import ScheduleItemCreate, ScheduleItemRead, ScheduleItemUpdate


router = APIRouter(
    prefix="/schedule",
    tags=["schedule"],
)


def _get_owned_course(
    database: Session,
    course_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Course:
    course = database.scalar(
        select(Course).where(
            Course.id == course_id,
            Course.user_id == user_id,
        )
    )
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return course


def _get_owned_schedule_item(
    database: Session,
    schedule_item_id: uuid.UUID,
    user_id: uuid.UUID,
) -> ScheduleItem:
    item = database.scalar(
        select(ScheduleItem).where(
            ScheduleItem.id == schedule_item_id,
            ScheduleItem.user_id == user_id,
        )
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule item not found",
        )
    return item


@router.get("", response_model=list[ScheduleItemRead])
def list_schedule_items(
    database: DatabaseSession,
    current_user: CurrentUser,
) -> list[ScheduleItem]:
    return list(
        database.scalars(
            select(ScheduleItem)
            .where(ScheduleItem.user_id == current_user.id)
            .order_by(ScheduleItem.weekday, ScheduleItem.start_time)
        ).all()
    )


@router.post(
    "",
    response_model=ScheduleItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_schedule_item(
    item_data: ScheduleItemCreate,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> ScheduleItem:
    if item_data.course_id is not None:
        _get_owned_course(database, item_data.course_id, current_user.id)

    item = ScheduleItem(
        title=item_data.title,
        weekday=item_data.weekday,
        start_time=item_data.start_time,
        end_time=item_data.end_time,
        location=item_data.location,
        course_id=item_data.course_id,
        user_id=current_user.id,
    )
    database.add(item)
    database.commit()
    database.refresh(item)
    return item


@router.patch("/{schedule_item_id}", response_model=ScheduleItemRead)
def update_schedule_item(
    schedule_item_id: uuid.UUID,
    item_data: ScheduleItemUpdate,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> ScheduleItem:
    item = _get_owned_schedule_item(database, schedule_item_id, current_user.id)
    updates = item_data.model_dump(exclude_unset=True)

    new_start = updates.get("start_time", item.start_time)
    new_end = updates.get("end_time", item.end_time)
    if new_end <= new_start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_time must be later than start_time",
        )

    if "course_id" in updates:
        course_id = updates["course_id"]
        if course_id is not None:
            _get_owned_course(database, course_id, current_user.id)

    for field, value in updates.items():
        setattr(item, field, value)

    database.commit()
    database.refresh(item)
    return item


@router.delete(
    "/{schedule_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_schedule_item(
    schedule_item_id: uuid.UUID,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Response:
    item = _get_owned_schedule_item(database, schedule_item_id, current_user.id)
    database.delete(item)
    database.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
