from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.database import check_database_connection
from app.routers.assignments import router as assignments_router
from app.routers.auth import router as auth_router
from app.routers.courses import router as courses_router
from app.routers.users import router as users_router

app = FastAPI(
    title="CampusPilot AI API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)
app.include_router(assignments_router)


@app.get("/")
def root():
    return {"message": "Welcome to CampusPilot AI"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/health/database")
def database_health_check():
    try:
        check_database_connection()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed",
        )

    return {
        "status": "healthy",
        "database": "connected",
    }