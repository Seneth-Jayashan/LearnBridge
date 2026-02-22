import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/AuthService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1️⃣ Check Session
    const checkSession = useCallback(async () => {
        try {
            const data = await authService.getCurrentUser();
            setUser(data.user);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // 2️⃣ Login
    const login = async (identifier, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.login(identifier, password);
            setUser(data.user);

            if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
            }

            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Login failed";
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    // 3️⃣ NEW: Register Donor
    const registerDonor = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            await authService.registerDonor(formData);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed";
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    // 4️⃣ Logout
    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            localStorage.removeItem("accessToken");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

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
        registerDonor, 

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