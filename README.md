# CampusPilot AI

CampusPilot AI is an AI-assisted student workspace for organizing academic work
and planning career goals. The Next.js frontend talks to a FastAPI backend, which
is the only layer that accesses PostgreSQL. JWT authentication and course and
assignment CRUD work end to end. AI tutoring and document storage remain planned
features.

## Planned features

- A dashboard for courses, assignments, and upcoming deadlines.
- Academic task planning and study reminders.
- An AI assistant for study planning and campus questions.
- A searchable collection of campus resources.

These ideas are an initial roadmap; detailed requirements and data sources still
need to be decided.

## Technology stack

- Next.js 16.3.6 with the App Router
- React 19.2.8
- TypeScript 5
- Tailwind CSS 4
- ESLint 9
- FastAPI with SQLAlchemy and Alembic
- PostgreSQL
- Node.js and npm for frontend dependency management

AI providers are intentionally not configured yet.

## Current repository structure

```text
CampusPilotAI/
|-- .gitignore             # Repository-wide ignore rules
|-- README.md              # Project overview
|-- frontend/
|   |-- .gitignore         # Frontend-specific ignore rules
|   |-- AGENTS.md          # Next.js guidance for coding assistants
|   |-- CLAUDE.md          # Reference to AGENTS.md
|   |-- README.md          # Frontend development instructions
|   |-- package.json
|   |-- package-lock.json
|   |-- next.config.ts
|   |-- eslint.config.mjs
|   |-- postcss.config.mjs
|   |-- tsconfig.json
|   |-- public/            # Static image assets
|   `-- src/
|       |-- app/           # Pages, layout, and styles
|       |-- components/    # Shared, landing, and dashboard UI components
|       `-- lib/
|           |-- api/        # FastAPI client, token storage, and API DTOs
|           `-- demo-data.ts # Static dashboard sample records
`-- backend/
    |-- alembic.ini        # Alembic configuration
    |-- requirements.txt   # Pinned Python dependencies
    |-- app/
    |   |-- main.py        # FastAPI application and health checks
    |   |-- config.py      # Environment-driven settings
    |   |-- database.py    # Engine, session factory, and Base
    |   |-- models.py      # SQLAlchemy models
    |   |-- schemas.py     # Pydantic request/response schemas
    |   |-- security.py    # Password hashing and JWT creation
    |   |-- dependencies.py # Auth and database dependencies
    |   `-- routers/       # auth, users, courses, and assignments endpoints
    `-- migrations/        # Alembic migration versions
```

Dependencies and generated build files are excluded from version control.

## Run the backend

Install Python 3.13 or newer. From the repository root, run in Windows
PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m alembic upgrade head
.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Copy `backend/.env.example` to `backend/.env` first and fill in a PostgreSQL
database you control plus a JWT secret. Never commit real credentials.

## Run the frontend

Install Node.js with npm. This project has been checked using Node.js 22.11.0
and npm 10.9.0. From the repository root, run in Windows PowerShell:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to the backend URL; copy
`frontend/.env.example` for the expected format.

Open the local URL printed in the terminal, normally <http://localhost:3000>.
Press Ctrl+C to stop the server. Edit `frontend/src/app/page.tsx` to change the
homepage composition. Sign in at `/login`, then visit `/dashboard` for the
student workspace. On macOS or Linux, use `npm` instead of `npm.cmd`.

See [frontend/README.md](frontend/README.md) for lint and production build
commands.

## Development roadmap

1. Establish the repository, documentation, and frontend design.
2. Add PostgreSQL persistence, models, seed data, and APIs. **Complete.**
3. Add database-backed course, assignment, and schedule interfaces. **Complete.**
4. Add authentication and user-specific access. **Complete.**
5. Add AI assistance using approved data sources and server-side credentials.
6. Add automated tests, accessibility validation, and deployment checks.

Keep local credentials in ignored environment files; do not commit secrets.
