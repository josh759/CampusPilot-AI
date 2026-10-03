import uuid

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, DatabaseSession
from app.models import Assignment, Course, User
from app.schemas import AssignmentCreate, AssignmentRead, AssignmentUpdate


router = APIRouter(
    prefix="/assignments",
    tags=["assignments"],
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


def _get_owned_assignment(
    database: Session,
    assignment_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Assignment:
    assignment = database.scalar(
        select(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .where(
            Assignment.id == assignment_id,
            Course.user_id == user_id,
        )
    )
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return assignment


@router.get("", response_model=list[AssignmentRead])
def list_assignments(
    database: DatabaseSession,
    current_user: CurrentUser,
) -> list[Assignment]:
    return list(
        database.scalars(
            select(Assignment)
            .join(Course, Assignment.course_id == Course.id)
            .where(Course.user_id == current_user.id)
            .order_by(Assignment.due_at)
        ).all()
    )


@router.post(
    "",
    response_model=AssignmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_assignment(
    assignment_data: AssignmentCreate,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Assignment:
    _get_owned_course(database, assignment_data.course_id, current_user.id)

    assignment = Assignment(
        title=assignment_data.title,
        due_at=assignment_data.due_at,
        status=assignment_data.status,
        course_id=assignment_data.course_id,
    )
    database.add(assignment)
    database.commit()
    database.refresh(assignment)
    return assignment


@router.patch("/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: uuid.UUID,
    assignment_data: AssignmentUpdate,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Assignment:
    assignment = _get_owned_assignment(database, assignment_id, current_user.id)
    updates = assignment_data.model_dump(exclude_unset=True)

    course_id = updates.pop("course_id", None)
    if course_id is not None:
        _get_owned_course(database, course_id, current_user.id)
        assignment.course_id = course_id

    for field, value in updates.items():
        if value is not None:
            setattr(assignment, field, value)

    database.commit()
    database.refresh(assignment)
    return assignment


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_assignment(
    assignment_id: uuid.UUID,
    database: DatabaseSession,
    current_user: CurrentUser,
) -> Response:
    assignment = _get_owned_assignment(database, assignment_id, current_user.id)
    database.delete(assignment)
    database.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)