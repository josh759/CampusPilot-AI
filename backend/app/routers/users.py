from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.dependencies import CurrentUser, DatabaseSession
from app.models import User
from app.schemas import UserCreate, UserRead
from app.security import hash_password

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get(
    "/me",
    response_model=UserRead,
)
def read_current_user(
    current_user: CurrentUser,
) -> User:
    return current_user


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_data: UserCreate,
    database: DatabaseSession,
) -> User:
    normalized_email = str(user_data.email).lower()

    existing_user = database.scalar(
        select(User).where(User.email == normalized_email)
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=normalized_email,
        full_name=user_data.full_name.strip(),
        hashed_password=hash_password(user_data.password),
    )

    database.add(user)

    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    database.refresh(user)
    return user