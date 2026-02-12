import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/Axios"; // Ensure this path is correct

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Check Session on Mount (The "me" route)
    useEffect(() => {
        const checkSession = async () => {
            try {
                // Calls GET /auth/me to validate the HTTP-Only cookie
                const { data } = await api.get("/auth/me");
                setUser(data.user);
            } catch (err) {
                // 401/403 errors are expected if not logged in
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    // 2. Login Action
    const login = async (identifier, password) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post("/auth/login", { identifier, password });
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
            await api.post("/auth/logout");
            setUser(null);
            // Optional: Redirect to login page logic here if not handled by components
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // 4. Register Donor Action
    const registerDonor = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            await api.post("/user/register-donor", userData);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed";
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    // 5. Restore Account Action
    const restoreAccount = async (identifier) => {
        setLoading(true);
        try {
            await api.post("/user/restore", { identifier });
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Restore failed";
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    // 6. Forgot Password Action (NEW)
    const forgotPassword = async (identifier) => {
        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { identifier });
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Request failed";
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    // 7. Reset Password Action (NEW)
    const resetPassword = async (identifier, otp, newPassword) => {
        setLoading(true);
        try {
            await api.post("/auth/reset-password", { identifier, otp, newPassword });
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Reset failed";
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        registerDonor,
        restoreAccount,
        forgotPassword, // Exported
        resetPassword,  // Exported
        
        // Helper booleans for easy UI logic
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isTeacher: user?.role === "teacher",
        isStudent: user?.role === "student",
        isDonor: user?.role === "donor",
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