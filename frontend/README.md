# CampusPilot AI frontend

This folder contains the Next.js App Router frontend. It currently displays the
starter homepage. See the [project README](../README.md) for the proposed features
and development roadmap.

## Local development

From this folder in Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

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
The starter uses `next/font/google` for Geist fonts, so the build needs access to
Google Fonts.

## Main files

- `src/app/page.tsx`: homepage content.
- `src/app/layout.tsx`: shared layout, fonts, and page metadata.
- `src/app/globals.css`: global styles and Tailwind CSS configuration.
- `public/`: static assets.

No environment variables are currently required. Future local environment files
must remain ignored. Dependencies, `.next`, and generated TypeScript files are
also ignored; repository-wide Python, cache, and IDE rules live in `../.gitignore`.
