import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoutes = ({ allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    
    // 1. Grab context from parent layouts (like DashboardLayout)
    const context = useOutletContext();

    // 2. Show a loader while checking session (prevent flickering)
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center mt-32 space-y-4 text-[#207D86]">
                {/* Modern Tailwind Spinner */}
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#207D86]"></div>
                <p className="font-semibold animate-pulse text-slate-500">Loading session...</p>
            </div>
        );
    }

    // 3. Check if User is Logged In
    if (!user) {
        // Redirect to login, but save the location they tried to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 4. Check for Role Access (RBAC)
    // If allowedRoles is provided, check if user's role is included
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 5. If all checks pass, render the child routes and FORWARD the context
    return <Outlet context={context} />;
};

export default ProtectedRoutes;