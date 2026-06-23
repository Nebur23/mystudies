# MyStudies

MyStudies is a modern GCE study platform built with React Router, TypeScript, Tailwind CSS, and Bun. It combines past papers, courses, practice quizzes, social discovery, user profiles, and analytics into a single learning workspace.

## What this project includes

- 📚 Library of past papers and study resources
- 🧠 Practice quizzes with question navigation and submission support
- 🎓 Courses and learning progress tracking
- 🌐 Social features like discovery, feed, and connections
- 🏆 Leaderboard and profile analytics
- 📄 File upload / document proxy support via UploadThing
- 📊 PostHog analytics and behavior tracking (client + server)
- 🌱 PWA-ready configuration for offline-friendly use
- 🧩 Auth, profile management, and onboarding flows

## Quick start

### Install dependencies

This project is designed to work with Bun, but `npm install` is also supported.

```bash
bun install
```

### Run locally

```bash
bun run react-router dev --host
```

Or with npm/yarn:

```bash
npm run dev
```

Then open `http://localhost:5173`.

## Useful scripts

- `bun run react-router dev --host` / `npm run dev` — start development server
- `bun run react-router build` / `npm run build` — build production app
- `bun run react-router-serve ./build/server/index.js` / `npm start` — serve built app
- `bun run ./app/db/migrate.ts` — run Drizzle migrations
- `bun run ./app/db/baseline.ts` — initialize database baseline
- `bun run ./app/db/seed/index.ts` — seed development data
- `bun run drizzle-kit studio` — open Drizzle ORM studio
- `bun run drizzle-kit generate` — generate Drizzle types and schema

## Environment configuration

Copy and configure your environment variables for auth, database, PostHog, and upload settings.

Example vars may include:

- `DATABASE_URL`
- `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `VITE_PUBLIC_POSTHOG_HOST`
- `UPLOADTHING_KEY`
- `AUTH_SECRET`

## Deployment notes

- Build the app with `npm run build` or `bun run react-router build`
- Deploy the generated `build/` directory and server entrypoint
- If using Docker, ensure the service exposes the correct port and uses the built artifacts

## Project structure

- `app/` — application entry, route modules, API routes, shared components
- `app/db/` — Drizzle ORM schema, migrations, and seed scripts
- `app/lib/` — auth, email, analytics, and helper utilities
- `app/routes/` — page routes for auth, courses, library, practice, profile, and social features
- `public/` — static assets
- `build/` — generated production output

## Notes

This repository is the client application for MyStudies, a study-focused platform designed for GCE exam preparation and student collaboration.
