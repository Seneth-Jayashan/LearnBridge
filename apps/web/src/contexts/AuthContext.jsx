import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/AuthService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Check Session 
    const checkSession = useCallback(async () => {
        try {
            // This will now successfully pass the token via the Axios interceptor
            const data = await authService.getCurrentUser();
            setUser(data.user);
        } catch (err) {
            // If the token is invalid/expired, wipe it and log the user out
            localStorage.removeItem("accessToken");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Run on Mount
    useEffect(() => {
        // Only bother checking session if we actually have a token saved
        const token = localStorage.getItem("accessToken");
        if (token) {
            checkSession();
        } else {
            setLoading(false); // Instantly stop loading if no token
        }
    }, [checkSession]);

    // 2. Login Action
    const login = async (identifier, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.login(identifier, password);
            
            // --- NEW: Save the token! ---
            if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
            }
            
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
            // --- NEW: Remove the token! ---
            localStorage.removeItem("accessToken");
            setUser(null);
        } catch (err) {
            console.error("Logout failed", err);
            // Even if the backend fails, clear local state
            localStorage.removeItem("accessToken");
            setUser(null);
        }
    };

    // 4. Manual Refresh 
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
        
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === "super_admin",
        isSchoolAdmin: user?.role === "school_admin",
        isAdmin: ["super_admin", "school_admin"].includes(user?.role), 
        isTeacher: user?.role === "teacher",
        isStudent: user?.role === "student",
        isDonor: user?.role === "donor",
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