import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../store/store";

interface ProtectedRoutesProps{
    element: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRoutesProps> = ({element}) => {
    const status = useSelector((state: RootState) => state.user.status);
    // Wait for the startup session check before deciding where to send the user.
    if (status === 'loading') return null;
    return status === 'authenticated' ? element : <Navigate to="/login" />
}

export default ProtectedRoute;