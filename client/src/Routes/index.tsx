import { useRoutes } from "react-router-dom";
import HomePage from "../pages/Home";
import LoginPage from "../pages/Login";
import SignupPage from "../pages/Signup";
import MoviesPage from "../pages/Movies";
import TVSeriesPage from "../pages/TV_Series";
import BookmarkPage from "../pages/Bookmark";
import { ReactNode } from "react";

const ProjectRoutes = () => {
    const element: ReactNode  = useRoutes([
        { path: "/", element: <HomePage />},
        { path: "/login", element: <LoginPage />},
        { path: "/signup", element: <SignupPage />},
        { path: "/movies", element: <MoviesPage />},
        { path: "/tv-series", element: <TVSeriesPage />},
        { path: "/bookmark", element: <BookmarkPage />}
    ])

    return element;
}

export default ProjectRoutes;