import { ReactNode, useEffect } from "react";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { setUser, setUnauthenticated } from "../store/userSlice";
import { setWatchlist, clearWatchlist } from "../store/watchlistSlice";

// On app load, restore the logged-in user from the session cookie via
// /auth/me. Without this, a page refresh wipes the in-memory Redux auth state
// and the user is bounced to /login despite a live server session.
export default function AuthBootstrap({ children }: { children: ReactNode }) {
    const dispatch = useDispatch();

    useEffect(() => {
        let active = true;
        api.get("/auth/me")
            .then((res) => {
                if (!active) return;
                // Guard against an empty body (e.g. a 304 with no payload): without
                // a user, treat it as unauthenticated rather than throwing.
                const u = res.data?.user;
                if (!u) {
                    dispatch(setUnauthenticated());
                    dispatch(clearWatchlist());
                    return;
                }
                const { fullName, email, favorites, watchlist, watchedMovies, ratings } = u;
                dispatch(setUser({ fullName, email, favorites, watchlist, watchedMovies, ratings }));
                // Now that a session is confirmed, load the per-item watchlist
                // (statuses + reminders) that backs the indicator and the page.
                api.get("/library/watchlist")
                    .then((r) => {
                        if (active) dispatch(setWatchlist(r.data?.items ?? []));
                    })
                    .catch(() => {
                        if (active) dispatch(clearWatchlist());
                    });
            })
            .catch(() => {
                if (active) {
                    dispatch(setUnauthenticated());
                    dispatch(clearWatchlist());
                }
            });
        return () => {
            active = false;
        };
    }, [dispatch]);

    return <>{children}</>;
}
