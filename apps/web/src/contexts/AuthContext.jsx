import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/AuthService";
import { setAccessToken } from "../api/Axios"; // Import the setter

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Check Session (The "Silent Refresh")
    const checkSession = useCallback(async () => {
    setLoading(true);
    try {
        console.log("🔄 checkSession: Attempting to restore session...");
        
        // DIRECT CALL: Skip authService to verify raw API response
        // Using the same 'api' instance ensures 'withCredentials: true' is sent
        const data  = await authService.refresh(); // This will attempt to refresh the token using the cookie
        
        console.log("✅ checkSession: Refresh Success!", data);
        
        // 1. Set Token
        setAccessToken(data.accessToken);

        // 2. Fetch User
        const userRes = await authService.getCurrentUser(); // This should now succeed with the new token
        console.log("👤 checkSession: User Loaded", userRes);
        
        setUser(userRes.user);

    } catch (err) {
        console.error("❌ checkSession: Failed", err.response?.data || err.message);
        
        // If this fails, it means the Cookie is missing or invalid.
        // We must clear everything to be safe.
        setUser(null);
        setAccessToken(null);
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
            
            // Save Access Token to Memory
            if (data.accessToken) {
                setAccessToken(data.accessToken);
            }
            console.log("Login successful. User data:", data);
            
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
            await authService.logout(); // Backend clears the cookie
            setAccessToken(null);       // Clear memory
            setUser(null);
            localStorage.removeItem("accessToken");
        } catch (err) {
            console.error("Logout failed", err);
            setAccessToken(null);
            setUser(null);
        }
    };

    const refreshUser = async () => {
        // Just re-fetching the profile is enough if the token is still valid
        try {
             const userData = await authService.getCurrentUser();
             console.log("User data refreshed:", userData);
             setUser(userData.user);
        } catch (err) {
             console.error("Refresh user failed", err);
        }
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