# CampusPilot AI

CampusPilot AI is an AI-assisted student workspace for organizing academic work
and planning career goals. Sprint 2 adds a PostgreSQL database, Prisma data layer,
server APIs, and assignment CRUD to the responsive Sprint 1 frontend. AI tutoring,
authentication, and document storage remain planned features.

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
- PostgreSQL with Prisma ORM
- Node.js and npm for development and dependency management

Authentication and AI providers are intentionally not configured yet.

## Current repository structure

```text
CampusPilotAI/
|-- .gitignore             # Repository-wide ignore rules
|-- README.md              # Project overview
`-- frontend/
    |-- .gitignore         # Frontend-specific ignore rules
    |-- AGENTS.md          # Next.js guidance for coding assistants
    |-- CLAUDE.md          # Reference to AGENTS.md
    |-- README.md          # Frontend development instructions
    |-- package.json
    |-- package-lock.json
    |-- next.config.ts
    |-- eslint.config.mjs
    |-- postcss.config.mjs
    |-- tsconfig.json
    |-- public/            # Static image assets
    |-- prisma/
    |   |-- schema.prisma  # PostgreSQL models and relations
    |   `-- seed.ts        # Development seed records
    `-- src/
        |-- app/          # Pages, API routes, layout, and styles
        |-- components/   # Shared, landing, and dashboard UI components
        `-- lib/
            |-- db/        # Server-side data-access functions
            |-- db.ts      # Prisma client singleton
            `-- types.ts    # Shared serialized UI types
```

Dependencies and generated build files are excluded from version control.

## Run the frontend

Install Node.js with npm. This project has been checked using Node.js 22.11.0
and npm 10.9.0. From the repository root, run in Windows PowerShell:

```powershell
cd frontend
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:migrate -- --name init
npm.cmd run db:seed
npm.cmd run dev
```

Set `DATABASE_URL` in `frontend/.env` before running the migration or seed. Copy
`frontend/.env.example` and use a PostgreSQL database you control. Never commit
real credentials.

Open the local URL printed in the terminal, normally <http://localhost:3000>.
Press Ctrl+C to stop the server. Edit `frontend/src/app/page.tsx` to change the
homepage composition. Visit `/dashboard` for the student workspace. On macOS or
Linux, use `npm` instead of `npm.cmd`.

See [frontend/README.md](frontend/README.md) for API routes, database commands,
lint, and production build commands.

## Development roadmap

1. Establish the repository, documentation, and frontend design.
2. Add PostgreSQL persistence, Prisma models, seed data, and APIs. **Complete.**
3. Add database-backed course, assignment, and schedule interfaces. **Complete.**
4. Add authentication and user-specific access.
5. Add AI assistance using approved data sources and server-side credentials.
6. Add automated tests, accessibility validation, and deployment checks.

Keep local credentials in ignored environment files; do not commit secrets.
