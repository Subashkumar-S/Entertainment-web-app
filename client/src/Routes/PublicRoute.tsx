import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../store/store";

interface PublicRoutesProps{
    element: JSX.Element;
}

const PublicRoute: React.FC<PublicRoutesProps> = ({element}) => {
    const isAuthenticated = useSelector((state: RootState) => state.user.email !== '');
    return isAuthenticated ? <Navigate to="/" /> : element;
}

export default PublicRoute;