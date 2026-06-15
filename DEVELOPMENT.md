# Cineplan — Development & Deployment

Tech stack, architecture, local setup, and deployment for Cineplan. For what the
app *does*, see the [README](./README.md).

## Table of contents

- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment variables](#environment-variables)
  - [Run locally (host Node + Docker data stores)](#run-locally-host-node--docker-data-stores)
  - [Run the full stack in Docker](#run-the-full-stack-in-docker)
- [Scripts](#scripts)
- [Testing](#testing)
- [API overview](#api-overview)
- [Deployment](#deployment)

## Tech stack

**Client** — Vite · React 18 · TypeScript · Redux Toolkit · React Router v6 ·
axios · Tailwind CSS · react-icons.

**Server** — Express · TypeScript · Mongoose / MongoDB · Passport (local) +
express-session · connect-redis / ioredis · pino. TMDB is proxied server-side
with a Redis cache-aside layer and normalized into flat, client-ready shapes.

**Worker** — a standalone `reminder-worker` (BullMQ on Redis · Mongoose · Resend)
that delivers scheduled watch-reminder emails out of band from the API.

**Tooling** — Vitest (unit tests) · ESLint · Docker Compose (MongoDB + Redis).

## Architecture

```
Browser (React SPA)
      │  /api/*  (session cookie)
      ▼
Express API  ──► MongoDB (users, watchlist, activity events)
      │
      ├──► Redis  (sessions + TMDB cache-aside + recent searches + BullMQ queue)
      │            │  delayed "reminders" jobs
      │            ▼
      │      reminder-worker  ──► Resend (email)  +  MongoDB (mark sent)
      │
      └──► TMDB API  (proxied; keys never reach the client)
```

- The **TMDB API key lives only on the server**; the client always talks to
  `/api/tmdb/*`, never to TMDB directly.
- TMDB responses are **cached in Redis** (per-resource TTLs) and **normalized**
  on the server (e.g. `normalizeTitle`) so the client renders one predictable
  shape and cache entries stay small.
- Sessions are stored in Redis; auth state is rehydrated on load via
  `/api/auth/me`.
- **Watch reminders** are scheduled as **BullMQ delayed jobs** in Redis when a
  user picks a time; the separate **reminder-worker** consumes the queue at the
  due moment and sends the email via Resend (re-checks state, marks sent
  idempotently, retries on failure).

## Repository layout

```
.
├── client/                 # React + Vite SPA
│   └── src/
│       ├── components/      # Card, TrailerModal, LibraryActions, GoogleSignInButton, …
│       ├── pages/           # Home, Movies, TV_Series, Bookmark, Watchlist, TitleDetails, Profile, …
│       ├── store/           # Redux Toolkit (user + watchlist slices)
│       └── utils/           # feed, recentlyViewed, track (+ unit tests)
├── server/                 # Express + TypeScript API
│   └── src/
│       ├── controllers/     # auth, favorites, library, watchlist, tmdb, events, insights, search
│       ├── services/        # tmdbService (append_to_response, discover, …)
│       ├── models/          # user, event, watchlistItem (Mongoose schemas)
│       ├── queue/           # reminderQueue (BullMQ producer)
│       ├── scripts/         # migrateWatchlist (one-off backfill)
│       ├── utils/           # cache, normalizeTitle, insights, watchlist, recentSearches (+ tests)
│       └── routes/          # /api/{auth,favorites,library,search,events,insights,tmdb}
├── worker/                 # reminder-worker: BullMQ consumer → Resend email
│   └── src/                # config, logger, email, models, index (Worker)
├── deploy/                 # docker-compose for the full local stack (+ worker)
├── .github/workflows/      # CI (lint · test · build)
└── .env.example           # single source of truth for all env vars
```

## Getting started

### Prerequisites

- Node.js 20+ and npm
- A free **TMDB v3 API key** — https://www.themoviedb.org/settings/api
- Docker (for MongoDB + Redis), or your own MongoDB and Redis instances

### Environment variables

There is **one `.env` at the repo root** — read by the server, the client (Vite),
and Docker Compose. Copy the template and fill in the secrets:

```bash
cp .env.example .env
```

| Variable | Required | Default | Notes |
|---|---|---|---|
| `SECRET` | yes | — | Long random string; signs the session cookie. |
| `TMDB_API_KEY` | yes | — | TMDB v3 key. `/api/tmdb/*` returns 502 until set. |
| `PORT` | no | `5000` | API port. |
| `CLIENT_ORIGIN` | no | `http://localhost:5173,http://localhost:3000` | CORS allowlist (comma-separated). |
| `VITE_API_BASE_URL` | no | `http://localhost:5000/api` | Where the client sends API calls. |
| `MONGODB_URI` | no | `mongodb://localhost:27017/cineplan` | Set to Atlas in prod. |
| `REDIS_URL` | no | `redis://localhost:6379` | Set to managed Redis in prod. |
| `NODE_ENV` | no | — | Set `production` to enable Secure/SameSite=None cookies and make secrets mandatory. |
| `GOOGLE_CLIENT_ID` | no | — | Enables "Continue with Google" when set with the secret. |
| `GOOGLE_CLIENT_SECRET` | no | — | Google OAuth client secret. |
| `GOOGLE_CALLBACK_URL` | no | `http://localhost:5000/api/auth/google/callback` | Must match an Authorized redirect URI in the Google console. |
| `RESEND_API_KEY` | no | — | Enables reminder emails (worker). Without it the worker runs but can't send. |
| `EMAIL_FROM` | no | `Cineplan <onboarding@resend.dev>` | Sender for reminder emails; use a verified domain in prod. |

> The `.env` file is gitignored — **never commit real secrets**. Only
> `.env.example` placeholders are tracked.

**Google OAuth (optional):** create an OAuth client at the
[Google Cloud console](https://console.cloud.google.com/apis/credentials), add
the callback URL above as an Authorized redirect URI, set the three `GOOGLE_*`
vars, and a "Continue with Google" button appears on Login/Signup automatically.
Leave them unset and the feature stays cleanly disabled.

### Run locally (host Node + Docker data stores)

Start just MongoDB and Redis in Docker, and run the app on your host:

```bash
# 1. data stores  (from the repo root)
docker compose -f docker-compose.dev.yml up -d

# 2. API  (new terminal, from repo root)
cd server && npm install && npm run dev      # http://localhost:5000

# 3. client  (new terminal, from repo root)
cd client && npm install && npm run dev       # http://localhost:5173

# 4. reminder-worker  (new terminal) — only needed for email reminders
cd worker && npm install && npm run dev
```

### Run the full stack in Docker

Build and run client + server + MongoDB + Redis together:

```bash
# from the repo root (reads ./.env automatically)
docker compose up -d --build
# client → http://localhost:8081 , api → http://localhost:8091
```

`SECRET` and `TMDB_API_KEY` must be set in the root `.env` or Compose refuses to
start. Mongo/Redis persist to bind mounts under `./volumes/`.

## Scripts

Run from `client/` or `server/`:

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Vite / nodemon). |
| `npm run build` | Production build (`tsc` typecheck + `vite build` on the client). |
| `npm test` | Run the Vitest unit suite once. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run lint` | ESLint (client). |

## Testing

Unit tests use **Vitest** and run in a lightweight node environment (no DB or
network):

```bash
cd server && npm test    # normalizeTitle / pickTrailer
cd client && npm test    # feed (recommendations fallback) / recentlyViewed
```

The tests cover the two trickiest pure-logic pieces: the server's TMDB
**details normalizer** (movie vs TV shape, certification source, trailer
selection priority, `similar` fallback, provider mapping) and the client's
**recommendations-fallback** blend plus the recently-viewed history rules.

## API overview

All routes are under `/api` and rate-limited.

| Prefix | Purpose |
|---|---|
| `/api/auth` | `signup`, `login`, `logout`, `me` (session rehydration), `config` (enabled providers), and Google OAuth (`google` + `google/callback`) when configured. |
| `/api/favorites` | Add / remove bookmarks. |
| `/api/library` | Watchlist CRUD (`GET/POST/PATCH/DELETE /watchlist`, with optional reminders that enqueue BullMQ jobs), watched toggle, ratings. |
| `/api/search` | Per-user recent searches in Redis (`recent`: get / record / clear). |
| `/api/events` | Ingest a view / search / bookmark interaction event (fire-and-forget). |
| `/api/insights` | Per-user analytics (summary, top genres, 14-day activity, recent titles) + `trending` computed from real events across users, with a TMDB fallback. |
| `/api/tmdb` | Proxied + cached + normalized TMDB: `trending`, `recommended`, `movies/popular`, `tv/popular`, `genres/:mediaType`, `discover/:mediaType`, `search`, `title/:mediaType/:id`, `title/:mediaType/:id/videos`, `tv/:id/season/:n`, and per-id detail/recommendation routes. |

## Deployment

- **Data stores:** point `MONGODB_URI` at MongoDB Atlas and `REDIS_URL` at a
  managed Redis (Upstash, Render, etc.) — no code or compose change needed.
- **Server:** set `NODE_ENV=production` (enables Secure + SameSite=None auth
  cookies and makes `SECRET`/`TMDB_API_KEY` mandatory), then `npm run build` and
  `npm run serve`, or build the `server/` Docker image.
- **Worker:** deploy `worker/` as its own always-on service (same `MONGODB_URI`,
  `REDIS_URL`, plus `RESEND_API_KEY` / `EMAIL_FROM`); it needs no inbound ports.
- **Client:** `npm run build` produces a static `dist/` to serve from any static
  host/CDN; set `VITE_API_BASE_URL` to the deployed API origin at build time.
- **CORS:** add the deployed client origin to `CLIENT_ORIGIN`.
