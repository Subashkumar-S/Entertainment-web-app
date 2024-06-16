import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../store/store";

interface ProtectedRoutesProps{
    element: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRoutesProps> = ({element}) => {
    const isAuthenticated = useSelector((state: RootState) => state.user.email !== '');
    return isAuthenticated ? element : <Navigate to="/login" />
}

export default ProtectedRoute;