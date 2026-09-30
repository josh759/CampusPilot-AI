# CampusPilot AI

CampusPilot AI is a planned AI-assisted student workspace for organizing academic
work and finding useful campus information. The repository currently contains a
Next.js starter frontend; the student-facing features below are proposed and are
not implemented yet.

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
- Node.js and npm for development and dependency management

No backend, database, authentication service, or AI provider is configured yet.

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
    `-- src/app/
        |-- favicon.ico
        |-- globals.css
        |-- layout.tsx
        `-- page.tsx       # Current starter homepage
```

Dependencies and generated build files are excluded from version control.

## Run the frontend

Install Node.js with npm. This project has been checked using Node.js 22.11.0
and npm 10.9.0. From the repository root, run in Windows PowerShell:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed in the terminal, normally <http://localhost:3000>.
Press Ctrl+C to stop the server. Edit `frontend/src/app/page.tsx` to change the
homepage. On macOS or Linux, use `npm` instead of `npm.cmd`.

See [frontend/README.md](frontend/README.md) for lint and production build commands.
No environment variables are required for the current starter application.

## Development roadmap

1. Establish the repository, documentation, and passing lint/build checks.
2. Confirm the first student workflows and design the dashboard.
3. Implement course, assignment, and task interfaces.
4. Choose a backend, data storage, and authentication approach.
5. Add AI assistance using approved data sources and server-side credentials.
6. Test accessibility, core workflows, and error handling before deployment.

Keep local credentials in ignored environment files; do not commit secrets.
