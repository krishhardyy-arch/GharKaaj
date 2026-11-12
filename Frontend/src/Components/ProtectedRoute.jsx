import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../JS/auth.js";

// checking that user is logged in with the correct role
// this only hides the page, the real protection is done by backend
const ProtectedRoute = ({ role, children }) => {
    let token = getToken();
    let user = getUser();

    if (!token || !user || user.role !== role) {
        return <Navigate to="/login" />;
    }
    return children;
};

export default ProtectedRoute;
