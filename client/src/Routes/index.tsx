import { useRoutes } from "react-router-dom";
import HomePage from "../pages/Home";
import LoginPage from "../pages/Login";
import SignupPage from "../pages/Signup";
import MoviesPage from "../pages/Movies";
import TVSeriesPage from "../pages/TV_Series";
import BookmarkPage from "../pages/Bookmark";
import { ReactNode } from "react";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import ProfilePage from "../pages/Profile";

const ProjectRoutes = () => {
    const element: ReactNode  = useRoutes([
        { path: "/", element: <ProtectedRoute element={<HomePage />} />},
        { path: "/login", element: <PublicRoute element={<LoginPage />} />},
        { path: "/signup", element: <PublicRoute element={<SignupPage />} />},
        { path: "/movies", element: <ProtectedRoute element={<MoviesPage />} />},
        { path: "/tv-series", element: <ProtectedRoute element={<TVSeriesPage />} />},
        { path: "/bookmark", element: <ProtectedRoute element={<BookmarkPage />} />},
        { path: "/profile", element: <ProtectedRoute element={<ProfilePage />} />}
    ])

    return element;
}

export default ProjectRoutes;