import { createContext, useContext, useState, useEffect, useCallback } from "react";
import schoolService from "../services/SchoolService"; // Ensure correct casing
import { useAuth } from "./AuthContext"; 

const SchoolAdminContext = createContext();

export const SchoolAdminProvider = ({ children }) => {
    const { isSchoolAdmin } = useAuth();
    
    // --- State ---
    const [schoolDetails, setSchoolDetails] = useState(null);
    const [students, setStudents] = useState([]);
    const [verifiedTeachers, setVerifiedTeachers] = useState([]);
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [loading, setLoading] = useState(false);

    // ==========================================
    // --- Data Fetching ---
    // ==========================================

    const fetchAllDashboardData = useCallback(async () => {
        if (!isSchoolAdmin) return; 
        
        setLoading(true);
        try {
            // Fetch everything simultaneously for maximum performance
            const [details, studentList, verifiedList, pendingList] = await Promise.all([
                schoolService.getMySchoolDetails(),
                schoolService.getSchoolStudents(),
                schoolService.getVerifiedTeachers(),
                schoolService.getPendingTeachers()
            ]);

            setSchoolDetails(details);
            setStudents(studentList);
            setVerifiedTeachers(verifiedList);
            setPendingTeachers(pendingList);
        } catch (err) {
            console.error("Failed to load school dashboard data", err);
        } finally {
            setLoading(false);
        }
    }, [isSchoolAdmin]);

    // Load data on mount if user is a School Admin
    useEffect(() => {
        if (isSchoolAdmin) {
            fetchAllDashboardData();
        }
    }, [isSchoolAdmin, fetchAllDashboardData]);

    // ==========================================
    // --- Actions: Profile ---
    // ==========================================

    const updateProfile = async (profileData) => {
        try {
            const res = await schoolService.updateSchoolProfile(profileData);
            setSchoolDetails(res.school); // Update local state
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to update profile" };
        }
    };

    // ==========================================
    // --- Actions: Teachers ---
    // ==========================================

    const verifyTeacher = async (teacherId) => {
        try {
            await schoolService.verifyTeacher(teacherId);
            // Re-fetch data to easily move them from 'Pending' to 'Verified' lists in UI
            await fetchAllDashboardData();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Verification failed" };
        }
    };

    const removeTeacher = async (teacherId) => {
        try {
            await schoolService.removeTeacherFromSchool(teacherId);
            // Optimistic UI Update: Remove immediately from verified list
            setVerifiedTeachers(prev => prev.filter(t => t._id !== teacherId));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to remove teacher" };
        }
    };

    // ==========================================
    // --- Actions: Students ---
    // ==========================================

    const createStudent = async (studentData) => {
        setLoading(true);
        try {
            await schoolService.createStudent(studentData);
            await fetchAllDashboardData(); // Refresh list to get new student with ID/RegNumber
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to create student" };
        } finally {
            setLoading(false);
        }
    };

    const updateStudentDetails = async (studentId, studentData) => {
        try {
            await schoolService.updateStudent(studentId, studentData);
            await fetchAllDashboardData(); // Refresh list to get populated grades/levels
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to update student" };
        }
    };

    const toggleStudentActiveStatus = async (studentId) => {
        try {
            await schoolService.toggleStudentStatus(studentId);
            // Optimistic UI update
            setStudents(prev => prev.map(s => 
                s._id === studentId ? { ...s, isActive: !s.isActive } : s
            ));
            return { success: true };
        } catch (err) {
            return { success: false, message: "Action failed" };
        }
    };

    const value = {
        // State
        schoolDetails,
        students,
        verifiedTeachers,
        pendingTeachers,
        loading,
        
        // Methods
        fetchAllDashboardData,
        updateProfile,
        verifyTeacher,
        removeTeacher,
        createStudent,
        updateStudentDetails,
        toggleStudentActiveStatus,
        
        // Expose raw service if needed
        schoolService
    };

    return <SchoolAdminContext.Provider value={value}>{children}</SchoolAdminContext.Provider>;
};

export const useSchoolAdmin = () => {
    const context = useContext(SchoolAdminContext);
    if (!context) {
        throw new Error("useSchoolAdmin must be used within a SchoolAdminProvider");
    }
    return context;
};