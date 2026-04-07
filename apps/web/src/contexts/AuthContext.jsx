import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/AuthService";
import { setAccessToken } from "../api/Axios"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Check Session (The "Silent Refresh")
    const checkSession = useCallback(async () => {
        setLoading(true);
        try {
            const data  = await authService.refresh(); 
            
            setAccessToken(data.accessToken);
            const userRes = await authService.getCurrentUser(); 
            setUser(userRes.user);

        } catch (err) {
            setUser(null);
            setAccessToken(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

// 2️⃣ Login (REMOVED setLoading)
    const login = async (identifier, password) => {
        setError(null);
        try {
            const data = await authService.login(identifier, password);
            
            if (data.requiresOtpVerification) {
                return { 
                    success: true, 
                    requiresOtpVerification: true, 
                    userId: data.userId,
                    message: data.message
                };
            }

            if (data.accessToken) {
                setAccessToken(data.accessToken);
                localStorage.setItem("accessToken", data.accessToken);
            }
            setUser(data.user);
            return { success: true };

        } catch (err) {
            const msg = err.response?.data?.message || "Login failed";
            setError(msg);
            return { success: false, message: msg };
        }
    };

    // 3️⃣ Verify First Login OTP (REMOVED setLoading)
    const verifyFirstLoginOtp = async (userId, otp) => {
        setError(null);
        try {
            const data = await authService.verifyFirstLoginOtp(userId, otp);
            return { success: true, resetToken: data.resetToken, message: data.message };
        } catch (err) {
            const msg = err.response?.data?.message || "OTP verification failed";
            setError(msg);
            return { success: false, message: msg };
        }
    };

    // 4️⃣ Complete First Login (REMOVED setLoading)
    const completeFirstLogin = async (resetToken, newPassword) => {
        setError(null);
        try {
            const data = await authService.setupNewPassword(resetToken, newPassword);
            
            if (data.accessToken) {
                setAccessToken(data.accessToken);
                localStorage.setItem("accessToken", data.accessToken);
            }
            
            setUser(data.user);
            return { success: true, message: data.message };
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to set up new password";
            setError(msg);
            return { success: false, message: msg };
        }
    };
    
    // 5️⃣ Register Donor
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

    // 6️⃣ Logout
    const logout = async () => {
        try {
            await authService.logout(); 
            setAccessToken(null);       
            setUser(null);
            localStorage.removeItem("accessToken");
        } catch (err) {
            console.error("Logout failed", err);
            setAccessToken(null);
            setUser(null);
        }
    };

    const refreshUser = async () => {
        try {
             const userData = await authService.getCurrentUser();
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
        verifyFirstLoginOtp, // Added
        completeFirstLogin,  // Added
        
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