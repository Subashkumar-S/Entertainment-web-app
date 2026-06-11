import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../store/store";

interface PublicRoutesProps{
    element: JSX.Element;
}

const PublicRoute: React.FC<PublicRoutesProps> = ({element}) => {
    const status = useSelector((state: RootState) => state.user.status);
    // Wait for the startup session check so we don't flash the login page.
    if (status === 'loading') return null;
    return status === 'authenticated' ? <Navigate to="/" /> : element;
}

export default PublicRoute;