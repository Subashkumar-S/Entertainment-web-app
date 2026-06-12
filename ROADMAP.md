# Entertainment Web App — Improvement Roadmap

> Plan to evolve this Frontend Mentor challenge solution into a production-grade,
> **backend-centric full-stack application** worth featuring in a portfolio.
>
> Guiding idea: today this is a polished frontend with a thin auth/bookmark API.
> The goal is to shift the center of gravity to the backend — caching, analytics,
> and observability — so it reads as a real full-stack system, and showcases the
> data/telemetry skills that are the differentiator.

_Last updated: 2026-06-10_

---

## Table of contents

1. [Where it stands today](#1-where-it-stands-today)
2. [Critical issues to fix first](#2-critical-issues-to-fix-first)
3. [Feature roadmap](#3-feature-roadmap)
4. [Implementation plan (milestones)](#4-implementation-plan-milestones)
5. [Target architecture](#5-target-architecture)
6. [Local development & environment config](#6-local-development--environment-configuration)
7. [Deployment plan](#7-deployment-plan)
8. [README rewrite checklist](#8-readme-rewrite-checklist)
9. [Appendix — file-by-file issues found](#9-appendix--file-by-file-issues-found)

---

## 1. Where it stands today

### What already works

- TMDB-powered browsing: **Home** (trending + recommended rows), **Movies**, **TV Series** pages.
- **Search** across pages.
- **Bookmark / favorite** add & remove, persisted per user in MongoDB.
- **Session-based auth** (Passport local strategy + Redis session store): signup, login, protected routes.
- **Profile** page.
- **Dockerized**: `docker-compose` orchestrates server + client + Redis.

### Actual stack

| Layer    | Technologies |
|----------|--------------|
| Client   | Vite, React 18, TypeScript, Redux Toolkit, React Router v6, Tailwind CSS, axios, react-icons |
| Server   | Express, TypeScript, Mongoose (MongoDB Atlas), Passport (local), express-session, connect-redis, Redis (ioredis + redis), bcrypt |
| Infra    | Docker, docker-compose (server, client, redis) |

> Note: the committed README still describes this as "Next.js + Styled Components,"
> which is wrong. See [§7](#7-readme-rewrite-checklist).

### Architecture (as-is)

```
Browser (Vite/React)
  ├── calls TMDB API directly  ← API key shipped in the client bundle
  └── calls Express API (hardcoded http://localhost:5000)
        ├── Passport local auth → sessions in Redis
        └── favorites → MongoDB (connection opened/closed PER REQUEST)
```

---

## 2. Critical issues to fix first

These are prerequisites — the new features live in the same backend, so the base
has to be healthy and safe before building on it.

### 2.1 Security — do immediately ⚠️

- [ ] **Rotate the MongoDB Atlas password.** A real `user:password` credential
      was committed in the old root `docker-compose.yml` and remains in git
      history (commit `89a6faa`). Rotating it makes the leaked one useless — this
      matters far more than scrubbing history. _(Manual — Atlas → Database Access.)_
- [ ] **Regenerate the TMDB API key.** It's committed in `client/.env` /
      `client/src/.env`. _(Manual — TMDB account.)_
- [x] **Stop tracking secrets.** `.gitignore` now ignores `.env`, `.env.*`, `*.env`,
      and the committed `server/.env`, `client/.env`, `client/src/.env` are untracked
      via `git rm --cached` (local copies kept; `client/src/.env` is a dead duplicate,
      safe to delete). `.env` is also excluded from images via `.dockerignore`. See
      [§6](#6-local-development--environment-configuration). _Rotation still required (above)._
- [x] **Add `.env.example`** templates (root, server, client) documenting every
      required variable with placeholder values.
- [ ] _(Optional)_ Scrub the secret from history with `git filter-repo` / BFG and
      force-push. Lower priority once the credential is rotated.

### 2.2 Functional bugs

- [ ] **Connect to Mongo once at startup.** `connectDB()` / `disconnectDB()` are
      currently called inside every controller (`authController.ts`,
      `favoriteController.ts`). `disconnectDB()` closes *all* connections, so
      concurrent requests tear down each other's in-flight queries — it works solo
      and goes flaky under any real use. Call `connectDB()` once in `index.ts`
      before `app.listen()`, and remove the per-request connect/disconnect calls.
- [ ] **Remove hardcoded API URLs from the client.** `http://localhost:5000` is
      hardcoded in 6+ places (`Navbar`, `Login`, `Signup`, `Card`, `TrendingCard`).
      Replace with a single axios instance using `VITE_API_BASE_URL`.
- [ ] **Reconcile TMDB env var names.** Code reads `VITE_APP_API_KEY`; one of the
      `.env` files defines `VITE_TMDB_API_KEY`. Pick one (and after §3.1 the key
      moves server-side entirely).

### 2.3 Deployment blockers

- [ ] **CORS origin is hardcoded** to `http://localhost:3000` (`index.ts`). Move to
      an env-driven allowlist, keep `credentials: true`.
- [ ] **Auth cookie is browser-invalid cross-site.** `secure: false` +
      `sameSite: 'none'` is rejected by Chrome, so login cookies won't persist
      across a Vercel-frontend / Render-API split. Use `secure: true` +
      `sameSite: 'none'` in production (HTTPS), `sameSite: 'lax'` in dev.
- [ ] **`PORT` has no default; `SECRET` falls back to `"secret"`.** Add a sane PORT
      default and fail fast if `SECRET` is missing in production.
- [ ] **Remove the malformed `proxy` field** in `client/package.json`
      (`http:ewa-server:5000`) — ineffective under Vite.

---

## 3. Feature roadmap

Effort: **S** ≈ hours · **M** ≈ ~1 day · **L** ≈ 1–2 days.

| #  | Feature | Tier | Effort | Demonstrates |
|----|---------|------|--------|--------------|
| 1  | TMDB proxy + Redis cache | 1 | M | Caching layer, API design, secret hygiene |
| 2  | Activity analytics dashboard | 1 | L | **ClickHouse / telemetry / aggregations** |
| 3  | API hardening + observability | 1 | M | Rate limiting, structured logs, tracing |
| 4  | Watchlist + watched + ratings | 2 | M | Richer data modeling, real CRUD |
| 5  | Personalized recommendations | 2 | M | Server-side logic beyond CRUD |
| 6  | In-app "Trending" from real events | 2 | S | Closing the analytics loop |
| 7  | Infinite scroll + search history | 3 | S | UX polish, Redis usage |
| 8  | Tests + GitHub Actions CI | 3 | S | Engineering maturity |
| 9  | Google OAuth (optional) | 3 | M | Auth breadth |

### Tier 1 — Make the backend the star

**1. Put TMDB behind your own API, cached in Redis.**
Today the client calls TMDB directly with the key in the bundle. Route those calls
through Express → TMDB and cache responses in Redis (already running for sessions)
with TTLs. Hides the key, removes rate-limit risk, and demonstrates a real
cache-aside layer with hit/miss metrics. Everything else builds on this.

**2. Activity analytics dashboard — the signature feature.**
Emit events (views, searches, bookmarks) and surface "your viewing insights": top
genres, search history, bookmarks over time. Store events in **ClickHouse** to
mirror the résumé directly (a Mongo-aggregation version is an acceptable fallback).
This is the single most differentiating feature — it turns a movie app into proof
of telemetry/analytics skill.

**3. Production-grade API hardening.**
Redis-backed rate limiting, structured logging (pino), a `/health` endpoint, and —
as a stretch — OpenTelemetry traces. Day-job skills made visible. Pairs with #1.

### Tier 2 — Richer product surface

**4. Watchlist + watched + ratings.** Extend the binary favorite into a richer
model: a separate watchlist, a "watched" flag, and 1–5 ratings. More CRUD, more
state, a non-trivial data model.

**5. Personalized recommendations.** Score the user's favorite genres server-side
and surface "Because you bookmarked X" rows (TMDB similar/recommendations + genre
affinity). Simple to build, looks smart.

**6. Real in-app "Trending."** Compute trending from your *own* event data (#2) —
most-viewed / most-bookmarked titles — instead of TMDB's global list.

### Tier 3 — Maturity signals

**7. Infinite scroll / pagination** on browse pages, plus per-user recent searches
+ autocomplete in Redis.
**8. Tests + CI.** A few Vitest/Jest tests (auth, favorites, cache) and a GitHub
Actions workflow with a status badge.
**9. Google OAuth** alongside the existing local auth (optional; recognizable but
not a differentiator).

---

## 4. Implementation plan (milestones)

### Milestone 0 — Secure & stabilize _(½–1 day)_

Everything in [§2](#2-critical-issues-to-fix-first): rotate secrets, stop tracking
`.env`, connect Mongo once at startup, env-drive URLs/CORS/cookies, add
`.env.example`. **End state:** safe repo that runs cleanly and could be deployed.

### Milestone 1 — Backend-ification _(1–2 days)_

- [ ] Central server `config` module (env: API base, CORS allowlist, TMDB key, Redis URL, Mongo URI).
- [ ] Env-driven CORS allowlist + corrected cookie flags.
- [ ] Single client axios instance on `VITE_API_BASE_URL`; remove all hardcoded URLs.
- [ ] `/api/tmdb/*` proxy routes (trending, movies, tv, search, details) — TMDB key server-side only.
- [ ] Redis cache-aside wrapper with TTL around the proxy; log cache hit/miss.
- [ ] Client switched to `/api/tmdb/*`; client-side TMDB key removed.
- [ ] `/health` endpoint; pino structured logging; Redis-backed rate limiting.

### Milestone 2 — Activity analytics _(1–2 days)_

- [x] `POST /api/events` ingestion endpoint (view, search, bookmark).
- [x] Storage: MongoDB `events` collection (the ClickHouse swap can sit behind the same ingestion/aggregation API later).
- [x] Client fires events on view / search / bookmark (fire-and-forget `trackEvent`).
- [x] Aggregation endpoints: summary, top genres, 14-day activity series, recent titles (`GET /api/insights`).
- [x] "Your insights" dashboard at `/profile` (account menu → "Your insights") with dependency-free charts; recharts is an easy drop-in upgrade.
- [x] In-app Trending row computed from events (#6) — `GET /api/insights/trending` scores views + 2×bookmarks across users (14-day window), enriches via cached TMDB data, and falls back to TMDB global trending when community data is sparse (keeps a fresh DB populated).

### Milestone 3 — Richer product _(1–2 days)_

- [ ] Extend favorites → watchlist + watched + rating (model + endpoints).
- [ ] UI: rating control, watched toggle, dedicated watchlist page.
- [ ] "Because you bookmarked…" recommendations row.
- [x] Infinite scroll/pagination on browse pages ("Load more"); per-user recent-searches via Redis (`/api/search/recent`) surfaced in the search dropdown.

### Milestone 4 — Polish & ship _(1 day)_

- [ ] Rewrite the README (see §7).
- [ ] Add screenshots / a short demo GIF.
- [x] Vitest tests (normalizer, recommendations feed, recently-viewed, recent-search merge) + GitHub Actions CI (lint · test · build for client & server) with a status badge.
- [ ] Deploy (see §6) and set env vars in each dashboard.
- [ ] Update the portfolio's project entry to the real live link.
- [ ] _(Optional)_ Google OAuth.

---

## 5. Target architecture

```
Browser (Vite / React / Redux Toolkit)
  │   single axios instance → VITE_API_BASE_URL
  ▼
Express API (TypeScript)
  ├── Auth        → Passport local + sessions in Redis
  ├── /api/tmdb/* → TMDB proxy + Redis cache (TTL, hit/miss)
  ├── /api/favorites, /watchlist, /ratings → MongoDB (pooled, connect once)
  ├── /api/events → ingestion → ClickHouse (analytics)
  ├── /api/insights → aggregations → dashboard
  └── cross-cutting: rate limiting (Redis), pino logging, /health, OTel traces

Data stores
  ├── MongoDB Atlas  — users, favorites, watchlist, ratings
  ├── Redis          — sessions, TMDB cache, rate limits, recent searches
  └── ClickHouse     — event analytics
```

---

## 6. Local development & environment configuration

The local stack runs **entirely in Docker** — client, server, MongoDB, and Redis.
Data-store URLs are env-driven, so the same server image points at local containers
in development and at cloud services in production.

### Running locally

```bash
cp .env.example .env        # then fill in SECRET and TMDB_API_KEY
docker compose up --build   # or: docker compose watch  (live reload)
```

This starts four services:

| Service | Image | Local URL |
|---------|-------|-----------|
| client  | Vite dev server | http://localhost:3000 |
| server  | Express API | http://localhost:5000 |
| mongo   | `mongo:7` | mongodb://localhost:27017 |
| redis   | `redis:7-alpine` | redis://localhost:6379 |

Mongo and Redis use named volumes (`mongo-data`, `redis-data`) so data survives
restarts, and the server waits on their healthchecks before starting.

### Local vs. production — one switch

`docker-compose.yml` reads the data-store URLs from the environment with
local-container defaults:

```yaml
MONGODB_URI: "${MONGODB_URI:-mongodb://mongo:27017/entertainment}"
REDIS_URL:   "${REDIS_URL:-redis://redis:6379}"
```

- **Local** — leave `MONGODB_URI` / `REDIS_URL` unset; the bundled containers are used.
- **Production** — set them (host env or platform dashboard) to cloud **MongoDB Atlas**
  and a managed **Redis** (Upstash / Render). No code or compose change needed.
- `SECRET` and `TMDB_API_KEY` are **required and have no default** — Compose refuses to
  start without them.

### Environment variable reference

| Variable | Used by | Local default | Production |
|----------|---------|---------------|-----------|
| `MONGODB_URI` | server | `mongodb://mongo:27017/entertainment` | Cloud Atlas URI |
| `REDIS_URL` | server | `redis://redis:6379` | Managed Redis URL |
| `SECRET` | server | — (required) | Session signing secret |
| `TMDB_API_KEY` | server | — (required) | Moves server-side with the TMDB proxy |
| `PORT` | server | `5000` | platform-assigned |
| `CLIENT_ORIGIN` | server | `http://localhost:3000` | deployed client origin (CORS) |
| `VITE_API_BASE_URL` | client | `http://localhost:5000/api` | deployed API origin |

### Secret hygiene — status

- [x] `.gitignore` ignores `.env`, `.env.*`, `*.env`; only `*.env.example` templates tracked.
- [x] Committed `server/.env`, `client/.env`, `client/src/.env` untracked via `git rm --cached`
      (local copies kept; `client/src/.env` is a dead duplicate, safe to delete).
- [x] `.env` excluded from Docker build context via `.dockerignore` (no secrets in images).
- [x] `.env.example` templates added at root, `server/`, and `client/`.
- [ ] **Manual, still required:** rotate the leaked Atlas password and regenerate the TMDB
      key — untracking does **not** remove them from git history (commit `89a6faa`).

---

## 7. Deployment plan

| Component        | Host | Notes |
|------------------|------|-------|
| Client (Vite)    | Vercel | Static build; set `VITE_API_BASE_URL` |
| API (Express)    | Render / Railway / Fly | Set all server env vars; HTTPS |
| Sessions/cache   | Render Key Value / Upstash Redis | Managed Redis |
| App database     | MongoDB Atlas | Rotated credentials |
| Analytics        | ClickHouse Cloud (free tier) | Optional; Mongo fallback |

Cross-site cookie checklist: API and client both on HTTPS, cookie
`secure: true` + `sameSite: 'none'`, CORS `credentials: true` with the client
origin in the allowlist.

---

## 8. README rewrite checklist

The current README is the untouched Frontend Mentor boilerplate. Replace it with:

- [ ] One-line description + **live demo link** + repo link.
- [ ] Correct stack (Vite/React/Redux/TS · Express/Mongo/Redis/Passport · ClickHouse).
- [ ] Architecture diagram (from §5) and a short "how it works" paragraph.
- [ ] Feature list with screenshots / demo GIF.
- [ ] Local setup: `.env.example`, install, run (Docker + non-Docker).
- [ ] Remove every "Note: Delete this note…" placeholder.

---

## 9. Appendix — file-by-file issues found

| Location | Issue |
|----------|-------|
| `docker-compose.yml` | ✅ Fixed — URLs now env-driven (local mongo/redis containers; cloud via env). Leaked Atlas credential still in history `89a6faa` → **rotate**. |
| `server/.env`, `client/.env`, `client/src/.env` | ✅ Untracked (`git rm --cached`) + gitignored; `.env.example` templates added. Keys still in history → **rotate**. `client/src/.env` is a dead duplicate. |
| `server/src/index.ts` | `connectDB()` never called at startup; CORS origin hardcoded; cookie `secure:false`+`sameSite:'none'`; `PORT` no default; `SECRET` weak fallback; `console.log` request logger |
| `server/src/controllers/authController.ts` | `connectDB()`/`disconnectDB()` called per request |
| `server/src/controllers/favoriteController.ts` | `connectDB()`/`disconnectDB()` called per request |
| `client/src/components/Navbar.tsx` | `baseURL: "http://localhost:5000/api"` hardcoded |
| `client/src/pages/Login/index.tsx` | Hardcoded `http://localhost:5000/...` |
| `client/src/pages/Signup/index.tsx` | Hardcoded `http://localhost:5000/...` |
| `client/src/components/Card.tsx` | Hardcoded favorites API URLs |
| `client/src/components/TrendingCard.tsx` | Hardcoded favorites API URLs |
| `client/src/components/CardWrapper.tsx`, `TrendingWrapper.tsx` | TMDB called directly from client with bundled key |
| `client/package.json` | Malformed `proxy` field (`http:ewa-server:5000`), ineffective under Vite |
| `README.md` | Untouched Frontend Mentor boilerplate; wrong stack; placeholder links |
