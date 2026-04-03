import { createContext, useContext, useState } from "react";
import userService from "../services/UserService";
import { useAuth } from "./AuthContext";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Update Profile Action
  const updateProfile = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.updateMyProfile(formData);
      // Sync the new data with AuthContext so the Header/Sidebar updates immediately
      await refreshUser(); 
      return { success: true, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // 2. Update Password Action
  const updatePassword = async (passwordData) => {
    setLoading(true);
    try {
      const res = await userService.updateMyPassword(passwordData);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Password update failed" };
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Account Action
  const deleteAccount = async () => {
    if (!window.confirm("Are you sure? This will deactivate your account.")) return;
    
    setLoading(true);
    try {
      await userService.deleteMyAccount();
      await logout(); // Kick user to login page after deletion
      return { success: true };
    } catch (err) {
      setError("Failed to delete account");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    updateProfile,
    updatePassword,
    deleteAccount
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};