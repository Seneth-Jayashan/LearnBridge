import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoutes = ({ allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // 1. Show a loader while checking session (prevent flickering)
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                <p>Loading session...</p>
            </div>
        );
    }

    // 2. Check if User is Logged In
    if (!user) {
        // Redirect to login, but save the location they tried to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Check for Role Access (RBAC)
    // If allowedRoles is provided, check if user's role is included
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 4. If all checks pass, render the child routes
    return <Outlet />;
};

export default ProtectedRoutes;