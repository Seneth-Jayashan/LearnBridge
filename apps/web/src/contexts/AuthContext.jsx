import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/AuthService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Check Session (Memoized to prevent loops if added to dependencies)
    const checkSession = useCallback(async () => {
        try {
            const data = await authService.getCurrentUser();
            setUser(data.user);
        } catch (err) {
            // 401 Unauthorized is expected if no session exists
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Run on Mount
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // 2. Login Action
    const login = async (identifier, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.login(identifier, password);
            setUser(data.user);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Login failed";
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    // 3. Logout Action
    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // 4. Manual Refresh (Useful if you update profile and want to reload user data)
    const refreshUser = async () => {
        await checkSession();
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        refreshUser,
        
        // Helper booleans
        isAuthenticated: !!user,
        // Standardized role checks (using optional chaining safely)
        isSuperAdmin: user?.role === "super_admin",
        isSchoolAdmin: user?.role === "school_admin",
        isAdmin: ["super_admin", "school_admin"].includes(user?.role), // Generic Admin check
        isTeacher: user?.role === "teacher",
        isStudent: user?.role === "student",
        isDonor: user?.role === "donor",
        
        // Verification Helpers
        isSchoolVerified: user?.isSchoolVerified ?? false,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};