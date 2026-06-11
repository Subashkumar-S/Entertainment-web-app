import { ReactNode, useEffect } from "react";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { setUser, setUnauthenticated } from "../store/userSlice";

// On app load, restore the logged-in user from the session cookie via
// /auth/me. Without this, a page refresh wipes the in-memory Redux auth state
// and the user is bounced to /login despite a live server session.
export default function AuthBootstrap({ children }: { children: ReactNode }) {
    const dispatch = useDispatch();

    useEffect(() => {
        api.get("/auth/me")
            .then((res) => {
                const { fullName, email, favorites, watchlist, watchedMovies, ratings } = res.data.user;
                dispatch(setUser({ fullName, email, favorites, watchlist, watchedMovies, ratings }));
            })
            .catch(() => {
                dispatch(setUnauthenticated());
            });
    }, [dispatch]);

    return <>{children}</>;
}
