# Cineplan

[![CI](https://github.com/Subashkumar-S/cineplan/actions/workflows/ci.yml/badge.svg)](https://github.com/Subashkumar-S/cineplan/actions/workflows/ci.yml)

**Cineplan** is a full-stack, TMDB-powered discovery-and-planning app for movies
and TV. It started as the
[Frontend Mentor "Entertainment web app" challenge](https://www.frontendmentor.io/challenges/entertainment-web-app-J-UhgAW1X)
and grew into a complete application: browse trending titles, open rich
movie/series detail pages, watch trailers in-app, see where to stream/rent/buy,
and manage a personal library (bookmarks, watchlist, watched, ratings) behind a
session-based auth flow.

> **On "streaming":** TMDB does not provide full-length video. The honest,
> fully-TMDB-powered product is **browse → details → play trailer (YouTube embed)
> → deep-link to real providers (JustWatch)**.

> **Building or deploying it?** Tech stack, architecture, local setup, and
> deployment live in **[DEVELOPMENT.md](./DEVELOPMENT.md)**.

---

## Features

- **Browse** — a Trending row computed from real community activity (with a TMDB
  fallback), popular Movies and TV Series pages, genre-filter chips, and "Load
  more" pagination.
- **Title details** (`/title/:mediaType/:id`) — responsive hero, poster, meta
  row (year · type · runtime/seasons · certification · rating), genres, overview,
  top cast, season/episode browser for series, "More like this" recommendations.
- **Trailers** — every Play affordance opens an in-app YouTube trailer modal
  (focus-trapped, Esc/overlay to close, background-scroll locked).
- **Where to watch** — streaming/rent/buy provider logos that deep-link to
  JustWatch for the title.
- **Personal library** — bookmark, watchlist, watched, and 1–5★ ratings, wired to
  the backend and rehydrated on refresh.
- **Watch reminders** — schedule any watchlist title for a date/time and get an
  **email reminder** when it's due. The watchlist has its own page (Upcoming /
  Planned / Watched) with inline reminder editing.
- **Recommended for you** — a blended popular feed that is personalized from your
  most recent bookmark, so the row is never empty.
- **Live search** — debounced multi-search dropdown with poster results, plus
  per-user **recent searches** (shown on focus, clearable).
- **Recently viewed** — a device-local history row on Home.
- **Activity insights** — a personal analytics dashboard (account menu → "Your
  insights"): titles viewed, searches, bookmarks, top genres, a 14-day activity
  chart, and watchlist stats (planned / watched / upcoming reminders).
- **Auth** — sign up / log in with a session cookie; protected routes; session
  rehydration; plus optional **"Continue with Google"** OAuth.

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
