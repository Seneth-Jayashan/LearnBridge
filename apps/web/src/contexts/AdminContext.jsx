import { createContext, useContext, useState, useCallback } from "react";
import adminService from "../services/AdminService"; // Ensure casing matches your file

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    // --- State ---
    const [users, setUsers] = useState([]); 
    const [schools, setSchools] = useState([]); // NEW: Cache for Schools table
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ==========================================
    // --- USER ACTIONS ---
    // ==========================================

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

    // Toggle Active/Inactive (Updates UI instantly)
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

    // Toggle Locked/Unlocked (Updates UI instantly)
    const toggleLock = async (userId) => {
        try {
            await adminService.toggleUserLock(userId);
            setUsers(prev => prev.map(u => 
                u._id === userId ? { ...u, isLocked: !u.isLocked } : u
            ));
            return { success: true };
        } catch (err) {
            return { success: false, message: "Action failed" };
        }
    };

    // Delete User (Removes from UI instantly)
    const deleteUser = async (userId) => {
        try {
            await adminService.deleteUser(userId);
            setUsers(prev => prev.filter(u => u._id !== userId));
            return { success: true };
        } catch (err) {
            return { success: false, message: "Failed to delete user" };
        }
    };

    // ==========================================
    // --- SCHOOL ACTIONS ---
    // ==========================================

    const fetchAllSchools = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllSchools();
            setSchools(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch schools");
        } finally {
            setLoading(false);
        }
    }, []);

    const createSchool = async (data) => {
        setLoading(true);
        try {
            const res = await adminService.createSchoolWithAdmin(data);
            // Re-fetch schools so the new one appears in the list
            await fetchAllSchools(); 
            return { success: true, ...res };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to create school" };
        } finally {
            setLoading(false);
        }
    };

    // Delete School (Removes from UI instantly)
    const deleteSchool = async (schoolId) => {
        try {
            await adminService.deleteSchool(schoolId);
            setSchools(prev => prev.filter(s => s._id !== schoolId));
            return { success: true };
        } catch (err) {
            return { success: false, message: "Failed to delete school" };
        }
    };

    const value = {
        // State
        users,
        schools,
        loading,
        error,
        
        // Methods: Users
        fetchAllUsers,
        toggleStatus,
        toggleLock,
        deleteUser,
        
        // Methods: Schools
        fetchAllSchools,
        createSchool,
        deleteSchool,
        
        // Raw Service (For direct one-off calls if needed in components)
        adminService 
    };

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error("useAdmin must be used within an AdminProvider");
    }
    return context;
};