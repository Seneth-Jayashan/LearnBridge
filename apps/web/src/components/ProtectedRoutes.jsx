import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoutes = ({ allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const context = useOutletContext();

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center mt-32 space-y-4 text-[#207D86]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#207D86]"></div>
                <p className="font-semibold animate-pulse text-slate-500">Loading session...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // THE FIX: Format the string perfectly. 
    // This turns "School Admin", "SCHOOL_ADMIN", or "school admin" all into "school_admin"
    const userRole = user.role?.toLowerCase()?.trim()?.replace(" ", "_");

    // Check if the user is allowed
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // DETECTIVE LOG: This will print in your browser console to tell us what went wrong
        console.warn(`🛑 ACCESS DENIED!`);
        console.warn(`Your Role: '${userRole}'`);
        console.warn(`Allowed Roles for this page:`, allowedRoles);
        console.warn(`Attempted URL:`, location.pathname);
        
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet context={context} />;
};

export default ProtectedRoutes;