# CampusPilot AI frontend

This folder contains the Next.js App Router application: a landing page at `/`,
a sign-in page at `/login`, and a student dashboard at `/dashboard`. The
frontend talks to the FastAPI backend in `../backend`; it never connects to
PostgreSQL directly. See the [project README](../README.md) for the proposed
features and development roadmap.

## Local development

From this folder in Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` first; `.env.example` contains the
expected format. The FastAPI backend must be running for sign-in and assignment
CRUD to work.

Open the URL printed in the terminal (normally <http://localhost:3000>).
Press Ctrl+C to stop the server. On macOS or Linux, replace `npm.cmd` with `npm`.

## Validation and production preview

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

Lint checks the source against ESLint rules. Build creates the production output
and checks TypeScript. Start serves the production build after a successful build.
The app uses `next/font/google` for Geist fonts, so the build needs access to
Google Fonts.

## Main files

- `src/app/page.tsx`: composes the landing-page sections.
- `src/app/login/page.tsx`: sign-in form that trades credentials for a JWT.
- `src/app/dashboard/page.tsx`: composes the student workspace.
- `src/app/layout.tsx`: shared layout, fonts, and page metadata.
- `src/app/globals.css`: global styles and Tailwind CSS configuration.
- `src/components/landing/`: navigation/footer, hero preview, and feature cards.
- `src/components/dashboard/`: sidebar, summary cards, courses, assignment CRUD,
  schedule, and study-assistant preview.
- `src/components/brand.tsx` and `icon.tsx`: reusable branding and local SVG icons.
- `src/lib/api/`: typed FastAPI client, access-token storage, and API DTOs.
- `src/lib/demo-data.ts`: static sample records for the dashboard demo panels.
- `public/`: static assets.

Pages and content components are Server Components except for the skip link,
the login form, and the interactive assignment manager. The dashboard renders
static sample data for courses, the schedule, and the study plan; assignment
creation, completion, and deletion call the FastAPI backend with the stored
Bearer token. The study-plan disclosure uses native HTML `details`/`summary`.

The demo workspace uses a fixed sample date of October 1, 2026, and the
development JWT is kept in localStorage for now. Live AI integration is still
planned. Course codes, instructors, locations, deadlines, and activity shown in
the sample panels are presentation fixtures.

Local environment files, dependencies, `.next`, and generated TypeScript files
remain ignored.
