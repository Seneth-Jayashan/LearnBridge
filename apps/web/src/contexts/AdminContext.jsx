import { createContext, useContext, useState, useCallback } from "react";
import adminService from "../services/AdminService";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const [users, setUsers] = useState([]); // Cache for All Users table
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all users and store in state
    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }, []);

    // Wrapper to create school (No state update needed mostly)
    const createSchool = async (data) => {
        setLoading(true);
        try {
            const res = await adminService.createSchoolWithAdmin(data);
            return { success: true, ...res };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed" };
        } finally {
            setLoading(false);
        }
    };

    // Toggle status and update local state immediately (Optimistic UI update)
    const toggleStatus = async (userId) => {
        try {
            await adminService.toggleUserStatus(userId);
            setUsers(prev => prev.map(u => 
                u._id === userId ? { ...u, isActive: !u.isActive } : u
            ));
            return { success: true };
        } catch (err) {
            return { success: false, message: "Action failed" };
        }
    };

    const value = {
        users,
        loading,
        error,
        fetchAllUsers,
        createSchool,
        toggleStatus,
        // Expose service directly for one-off calls if needed
        adminService 
    };

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => useContext(AdminContext);