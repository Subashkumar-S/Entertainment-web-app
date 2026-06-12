# Entertainment Web App

A full-stack, TMDB-powered streaming-style web app. It started as the
[Frontend Mentor "Entertainment web app" challenge](https://www.frontendmentor.io/challenges/entertainment-web-app-J-UhgAW1X)
and grew into a complete application: browse trending titles, open rich
movie/series detail pages, watch trailers in-app, see where to stream/rent/buy,
and manage a personal library (bookmarks, watchlist, watched, ratings) behind a
session-based auth flow.

> **On "streaming":** TMDB does not provide full-length video. The honest,
> fully-TMDB-powered product is **browse → details → play trailer (YouTube embed)
> → deep-link to real providers (JustWatch)**. See
> [`STREAMING-PLAN.md`](./STREAMING-PLAN.md) for the design rationale and
> [`ROADMAP.md`](./ROADMAP.md) for the longer-term plan.

---

## Table of contents

- [Features](#features)
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
- [Accessibility & performance](#accessibility--performance)
- [Attribution](#attribution)

---

## Features

- **Browse** — trending row, popular Movies and TV Series pages, genre-filter
  chips, and "Load more" pagination.
- **Title details** (`/title/:mediaType/:id`) — responsive hero, poster, meta
  row (year · type · runtime/seasons · certification · rating), genres, overview,
  top cast, season/episode browser for series, "More like this" recommendations.
- **Trailers** — every Play affordance opens an in-app YouTube trailer modal
  (focus-trapped, Esc/overlay to close, background-scroll locked).
- **Where to watch** — streaming/rent/buy provider logos that deep-link to
  JustWatch for the title.
- **Personal library** — bookmark, watchlist, watched, and 1–5★ ratings, wired to
  the backend and rehydrated on refresh; the Bookmarks page has Bookmarks /
  Watchlist tabs with empty states.
- **Recommended for you** — a blended popular feed that is personalized from your
  most recent bookmark, so the row is never empty.
- **Live search** — debounced multi-search dropdown with poster results.
- **Recently viewed** — a device-local history row on Home.
- **Auth** — sign up / log in with a session cookie; protected routes; session
  rehydration via `/api/auth/me`.

## Tech stack

**Client** — Vite · React 18 · TypeScript · Redux Toolkit · React Router v6 ·
axios · Tailwind CSS · react-icons.

**Server** — Express · TypeScript · Mongoose / MongoDB · Passport (local) +
express-session · connect-redis / ioredis · pino. TMDB is proxied server-side
with a Redis cache-aside layer and normalized into flat, client-ready shapes.

**Tooling** — Vitest (unit tests) · ESLint · Docker Compose (MongoDB + Redis).

## Architecture

```
Browser (React SPA)
      │  /api/*  (session cookie)
      ▼
Express API  ──► MongoDB (users, library)
      │
      ├──► Redis  (sessions + TMDB cache-aside)
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

## Repository layout

```
.
├── client/                 # React + Vite SPA
│   └── src/
│       ├── components/      # Card, CardWrapper, TrailerModal, LibraryActions, …
│       ├── pages/           # Home, Movies, TV_Series, Bookmark, TitleDetails, …
│       ├── store/           # Redux Toolkit (user/library slice)
│       └── utils/           # feed, recentlyViewed (+ unit tests)
├── server/                 # Express + TypeScript API
│   └── src/
│       ├── controllers/     # auth, favorites, library, tmdb
│       ├── services/        # tmdbService (append_to_response, discover, …)
│       ├── utils/           # cache, normalizeTitle (+ unit tests)
│       └── routes/          # /api/auth, /api/favorites, /api/library, /api/tmdb
├── deploy/                  # docker-compose for the full local stack
├── .env.example            # single source of truth for all env vars
├── STREAMING-PLAN.md        # details-page & streaming-surface design plan
└── ROADMAP.md               # longer-term, backend-centric roadmap
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
| `MONGODB_URI` | no | `mongodb://localhost:27017/entertainment` | Set to Atlas in prod. |
| `REDIS_URL` | no | `redis://localhost:6379` | Set to managed Redis in prod. |
| `NODE_ENV` | no | — | Set `production` to enable Secure/SameSite=None cookies and make secrets mandatory. |

> The `.env` file is gitignored — **never commit real secrets**. Only
> `.env.example` placeholders are tracked.

### Run locally (host Node + Docker data stores)

Start just MongoDB and Redis in Docker, and run the app on your host:

```bash
# 1. data stores
cd deploy && docker compose -f docker-compose.dev.yml up -d

# 2. API  (new terminal, from repo root)
cd server && npm install && npm run dev      # http://localhost:5000

# 3. client  (new terminal, from repo root)
cd client && npm install && npm run dev       # http://localhost:5173
```

### Run the full stack in Docker

Build and run client + server + MongoDB + Redis together:

```bash
cd deploy
docker compose up --build
# client → http://localhost:3000 , api → http://localhost:5000
```

`SECRET` and `TMDB_API_KEY` must be set in the root `.env` or Compose refuses to
start. Mongo/Redis persist to bind mounts under `deploy/volumes/`.

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
| `/api/auth` | `signup`, `login`, `logout`, `me` (session rehydration). |
| `/api/favorites` | Add / remove bookmarks. |
| `/api/library` | Watchlist, watched toggle, ratings. |
| `/api/tmdb` | Proxied + cached + normalized TMDB: `trending`, `recommended`, `movies/popular`, `tv/popular`, `genres/:mediaType`, `discover/:mediaType`, `search`, `title/:mediaType/:id`, `title/:mediaType/:id/videos`, `tv/:id/season/:n`, and per-id detail/recommendation routes. |

## Deployment

- **Data stores:** point `MONGODB_URI` at MongoDB Atlas and `REDIS_URL` at a
  managed Redis (Upstash, Render, etc.) — no code or compose change needed.
- **Server:** set `NODE_ENV=production` (enables Secure + SameSite=None auth
  cookies and makes `SECRET`/`TMDB_API_KEY` mandatory), then `npm run build` and
  `npm run serve`, or build the `server/` Docker image.
- **Client:** `npm run build` produces a static `dist/` to serve from any static
  host/CDN; set `VITE_API_BASE_URL` to the deployed API origin at build time.
- **CORS:** add the deployed client origin to `CLIENT_ORIGIN`.

## Accessibility & performance

- Off-screen images use `loading="lazy"` + `decoding="async"`; the detail hero
  stays eager as the LCP image.
- Cards are keyboard-operable (`role="button"`, `tabIndex`, Enter/Space), nav
  icons have accessible names, and a global `:focus-visible` ring makes keyboard
  focus visible everywhere.
- The trailer modal uses `role="dialog"` / `aria-modal`, traps Tab focus, closes
  on Esc/overlay, locks background scroll, and restores focus on close.

## Attribution

- This product uses the **TMDB API** but is not endorsed or certified by TMDB.
  Movie/TV data and images © [The Movie Database](https://www.themoviedb.org/).
- "Where to watch" data is **powered by JustWatch**.
- Original challenge by [Frontend Mentor](https://www.frontendmentor.io). Their
  design files are not redistributed in this repo (see `.gitignore`).
