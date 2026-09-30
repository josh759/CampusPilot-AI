# CampusPilot AI frontend

This folder contains the Next.js App Router application: a landing page at `/`
and a PostgreSQL-backed student dashboard at `/dashboard`. See the
[project README](../README.md) for the proposed features and development roadmap.

## Local development

From this folder in Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:migrate -- --name init
npm.cmd run db:seed
npm.cmd run dev
```

Set `DATABASE_URL` in `.env` first. `.env.example` contains the expected
PostgreSQL connection format. The database must exist before running migrations.

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
- `src/app/dashboard/page.tsx`: composes the student workspace.
- `src/app/layout.tsx`: shared layout, fonts, and page metadata.
- `src/app/globals.css`: global styles and Tailwind CSS configuration.
- `src/components/landing/`: navigation/footer, hero preview, and feature cards.
- `src/components/dashboard/`: sidebar, summary cards, courses, assignment CRUD,
  schedule, and study-assistant preview.
- `src/components/brand.tsx` and `icon.tsx`: reusable branding and local SVG icons.
- `src/lib/db.ts`: Prisma client singleton.
- `src/lib/db/`: server-only user, course, assignment, and schedule queries.
- `prisma/schema.prisma`: PostgreSQL schema and relations.
- `prisma/seed.ts`: repeatable Joshua development data.
- `public/`: static assets.

Pages and content components are Server Components except for the skip link and
interactive assignment manager. The dashboard reads through the server data-access
layer. Assignment creation, completion, and deletion call the typed route handlers
under `/api/assignments`. The study-plan disclosure uses native HTML
`details`/`summary`.

The seed uses a fixed demo date of September 30, 2026. There is no login or live AI
integration yet. Course codes, instructors, locations, deadlines, and activity are
development records created by the seed script.

The API surface currently includes `GET /api/courses`, `GET /api/assignments`,
`POST /api/assignments`, `PATCH /api/assignments/:id`, `DELETE /api/assignments/:id`,
and `GET /api/schedule`. Local environment files, dependencies, `.next`, and
generated TypeScript files remain ignored.
