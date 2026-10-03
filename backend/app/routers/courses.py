from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.dependencies import CurrentUser, DatabaseSession
from app.models import Course
from app.schemas import CourseCreate, CourseRead


router = APIRouter(
    prefix="/courses",
    tags=["courses"],
)


@router.get("", response_model=list[CourseRead])
def list_courses(
    database: DatabaseSession,
    current_user: CurrentUser,
) -> list[Course]:
    return list(
        database.scalars(
            select(Course)
            .where(Course.user_id == current_user.id)
            .order_by(Course.created_at)
        ).all()
    )


@router.post(
    "",
    response_model=CourseRead,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    course_data: CourseCreate,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Course:
    course = Course(
        code=course_data.code,
        name=course_data.name,
        user_id=current_user.id,
    )
    database.add(course)

    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A course with this code already exists",
        )

    database.refresh(course)
    return course