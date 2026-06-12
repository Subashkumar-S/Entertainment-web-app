# Details Page & Streaming App — Implementation Plan

> Companion to [ROADMAP.md](./ROADMAP.md). This doc focuses on two things the user
> asked for: (1) fix the empty **"Recommended for you"** row, (2) add a **title
> details page** reachable by clicking a card — and then a phased path to a
> full-featured, TMDB-powered streaming-style app (responsive: mobile/tablet/desktop).

_Last updated: 2026-06-12 — Phases 0–6 complete; only manual screenshots/deploy remain._

---

## Two realities that shape this plan

1. **Design source.** The provided `entertainment-web-app.fig` is a binary Figma
   file (can't be read here), and the Frontend Mentor "Entertainment web app"
   challenge has **no details-page or video-player frame** — those are net-new.
   New screens are therefore designed to match the **existing design system**
   already in the code: Outfit font, `dark-blue` / `semi-dark-blue` palette, the
   card + bookmark-pill + meta-row patterns, and the Tailwind `sm` (640) / `md`
   (768) / `lg` (1024) / `xl` (1280) breakpoints in use today (mobile ≈375,
   tablet ≈768, desktop ≈1440). _If exact frames are exported as PNG/SVG, specs
   can be matched pixel-for-pixel._

2. **"Streaming" with TMDB.** TMDB does **not** provide full-length video. It
   provides **trailers/clips** (YouTube keys via `/videos`) and **"where to watch"**
   provider info (via `/watch/providers`). So the realistic product is:
   browse → details → **play trailer (YouTube embed)** + **provider deep-links**.
   A real in-app player of full titles needs a separate licensed/sample video
   source — see [Phase 5](#phase-5--streaming-surface-decision-gated).

---

## Current state (ground truth from the code)

| Area | Status |
|------|--------|
| TMDB proxy (`server/.../tmdbController.ts`) | trending, movies/popular, tv/popular, search(multi), movie/:id, tv/:id, movie/:id/recommendations. **No** credits/videos/images/providers/tv-recs/seasons/genres/discover. |
| Routes (`client/.../Routes/index.tsx`) | `/`, `/login`, `/signup`, `/movies`, `/tv-series`, `/bookmark`. **No details route.** |
| Cards (`Card.tsx`, `TrendingCard.tsx`) | Have a "Play" overlay + bookmark button but **no click navigation**. |
| Library model (`userModel.ts`) | `favorites`, `watchlist`, `watchedMovies`, `ratings` exist; `/api/library/*` wired but **no client UI uses them**. |
| Recommended row (`CardWrapper.tsx`) | Only fills when `favorites.length > 0`, off `/tmdb/movie/{favorites[0]}/recommendations` → **empty for new users** (the bug in the screenshot). |

### Bugs to fold in while we're here
- **Category icon never shows on grid cards**: `Card.tsx` checks `category === 'Movie'`/`'TV Series'`, but `CardWrapper` passes lowercase `'movie'`/`'tv'`.
- Cards show `original_title`/`original_name` (non-localized) instead of `title`/`name`.
- `ContentWrapper.tsx` has a leftover `console.log`.
- Bookmark page resolves each id by trying movie then tv (two calls) — brittle; store media_type with the favorite instead.

---

## Phase 0 — Fix "Recommended for you" + quick wins (½ day)

**Goal:** the row is never empty, and is personalized when possible.

- [x] **Server:** add `GET /api/tmdb/recommended` — when no personalization is
      available, return a blended popular movies+tv feed (cache 1h). _(extends
      `tmdbService.ts` / `tmdbController.ts` / `tmdbRoutes.ts`)_
- [x] **Server:** add `tv/:id/recommendations` (mirror of the movie one).
- [x] **Client (`CardWrapper.tsx`):** for the home grid —
      - if user has favorites → fetch recommendations for the most recent favorite
        (movie **or** tv, using its stored media_type), then **fall back/merge**
        with `/tmdb/recommended` so the grid is always full;
      - if no favorites → just `/tmdb/recommended`.
- [x] **Fix** the category-icon string mismatch and switch display to `title`/`name`.
- [x] **Remove** the stray `console.log` in `ContentWrapper.tsx`.
- [x] **Verify:** new account (no bookmarks) shows a populated "Recommended for you".

---

## Phase 1 — Title details page (movie + series) (1–1.5 days)

**Goal:** clicking any card opens `/title/:mediaType/:id` with a rich, responsive page.

### 1a. Server — enrich the details endpoints
- [x] Extend `getMovie`/`getTv` to pass `append_to_response=credits,videos,images,recommendations,similar,watch/providers` (+ `release_dates` for movies / `content_ratings` for tv → certification). _(`tmdbService.ts`)_
- [x] Add a unified `GET /api/tmdb/title/:mediaType/:id` controller that validates `mediaType ∈ {movie,tv}` and returns a **normalized** shape (title, year, runtime/seasons, genres, overview, cast[], trailerKey, providers, backdrop/poster, certification, recommendations[]). Keeps the client simple. _(`tmdbController.ts`, `tmdbRoutes.ts`)_
- [x] Cache per id (1 day, matching existing detail TTL).

### 1b. Client — routing + navigation
- [x] Add route `{ path: "/title/:mediaType/:id", element: <ProtectedRoute element={<TitleDetails/>} /> }`. _(`Routes/index.tsx`)_
- [x] Make `Card` and `TrendingCard` navigate on click (wrap media in a `Link`/`onClick → navigate`), with `stopPropagation` on the bookmark and Play buttons so they don't trigger navigation.
- [x] Carry `media_type` on each card so the link targets the right `:mediaType`.

### 1c. Client — the `TitleDetails` page (new `pages/TitleDetails/index.tsx`)
Sections (all driven by the normalized endpoint):
- [x] **Hero**: full-bleed backdrop with gradient scrim; title, year • type • runtime/seasons • rating • certification meta row (reuse the existing meta-row pattern).
- [x] **Poster + actions**: bookmark (favorites), **+ Watchlist**, **Watched** toggle, **star rating (1–5)** → wire to `/api/library/*` (endpoints already exist).
- [x] **"Play trailer"** button → opens the trailer modal (Phase 2).
- [x] **Overview**, **genres** (chips), **top cast** (horizontal avatar row).
- [x] **"Where to watch"** provider logos (Phase 2).
- [x] **"More like this"** = recommendations/similar grid (reuses `Card`).
- [x] **Loading skeletons** + **error/empty** states.

### 1d. Responsive (match the existing breakpoints)
- [x] **Mobile (<768):** single column — backdrop on top, stacked meta, actions as a row, cast/recs horizontally scrollable.
- [x] **Tablet (≥768):** poster beside meta; 2–3 col recommendation grid.
- [x] **Desktop (≥1024):** hero backdrop with overlaid title; content + a right-rail (providers, facts); 4-col recommendation grid (mirrors `CardWrapper`'s `xl:grid-cols-4`).
- [x] Sidebar `Navbar` stays as-is (already responsive).

---

## Phase 2 — Trailer playback + "Where to watch" (½ day)

- [x] **Trailer modal** component: YouTube iframe from the `trailerKey`; focus-trap, Esc/overlay-to-close, no background scroll.
- [x] Wire **every "Play" affordance** (grid cards, trending cards, details hero) to open the trailer modal for that title.
- [x] **Provider row**: render `watch/providers` (flatrate/rent/buy) logos for the user's region with a JustWatch attribution link (TMDB's required attribution).
- [x] Empty-state copy when a title has no trailer / no providers.

---

## Phase 3 — Library UX: watchlist · watched · ratings (1 day)

Wire the **already-built** `/api/library/*` endpoints into the UI and the Redux store.

- [x] Extend `userSlice` with `watchlist`, `watchedMovies`, `ratings` (+ reducers); hydrate them in `/auth/me` (extend `authController.me` to return them).
- [x] Card/details controls: bookmark (favorite) vs **+ Watchlist** vs **Watched** vs **Rate**.
- [x] **Bookmark page → tabs/sections**: "Bookmarked Movies", "Bookmarked TV", and a separate **Watchlist** view; store `media_type` alongside each id to drop the brittle movie-then-tv probing.
- [x] Optional "Watched" filter + your-rating badge on cards.

---

## Phase 4 — Browse depth (1–1.5 days)

- [x] **Genres**: `GET /api/tmdb/genres`; genre chips/filter on Movies & TV pages.
- [x] **Discover**: `GET /api/tmdb/discover/:mediaType?genre=&sort=` → genre rows ("Action", "Comedy", …) on Home.
- [x] **TV seasons/episodes**: `GET /api/tmdb/tv/:id/season/:n`; a season selector + episode list on the details page for series.
- [x] **Infinite scroll / pagination** on Movies, TV, search, and recommendation grids (the proxy already takes `page`).
- [x] **Search upgrade**: debounced live multi-search with poster results; **recent searches per user in Redis** (recall from ROADMAP #7).

---

## Phase 5 — Streaming surface (decision-gated) (½–1 day)

TMDB has no full content, so "play" must resolve to one of:

- **Option A — Trailers + providers (recommended, realistic).** "Play" = trailer
  modal; "Where to watch" deep-links to real providers. Honest, fully TMDB-powered,
  no licensing problem. (This is already delivered by Phases 1–2.)
- **Option B — Demo player.** Add an HLS player (`hls.js`) fed by public sample/test
  streams (or a few self-hosted clips) to showcase a real player UX — clearly
  labeled "demo," since TMDB can't supply the actual film. Adds: player page,
  controls, "resume" position in localStorage, "Continue watching" row.

> **Recommendation:** ship **Option A** as the default product; treat **Option B**
> as an optional portfolio flourish. Pick before starting this phase.

---

## Phase 6 — Polish & ship (½ day)

- [x] Skeletons + empty/error states everywhere; image `loading="lazy"` (+ `decoding="async"`; detail hero stays eager as the LCP image).
- [x] Basic a11y pass: keyboard-operable cards (`role`/`tabindex`/Enter-Space), accessible names on icon nav links, keyboard-operable account menu, global `:focus-visible` ring, trailer modal focus-trap + focus restore.
- [x] Vitest tests — server `normalizeTitle`/`pickTrailer` (details normalizer) and client `feed` (recommendations fallback) + `recentlyViewed`. `npm test` in each package; 33 tests.
- [x] Rewrote README (full-stack overview, env, run, scripts, API, deploy, a11y, attribution).
- [ ] _Manual (needs the user):_ add screenshots and run the actual deploy (creds/host required).

---

## Suggested order of execution

1. **Phase 0** (fixes the visible bug — fast win).
2. **Phase 1 + 2** (the headline feature: clickable details + trailer playback).
3. **Phase 3** (library UX — leverages endpoints that already exist).
4. **Phase 4** (depth), **Phase 5** (decision), **Phase 6** (polish).

Each phase is independently shippable and ends in a working build.
