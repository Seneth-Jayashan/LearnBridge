import { createContext, useContext, useState, useEffect, useCallback } from "react";
import schoolService from "../services/SchoolService";
import { useAuth } from "./AuthContext"; // To check if we are actually a school admin

const SchoolAdminContext = createContext();

export const SchoolAdminProvider = ({ children }) => {
    const { isSchoolAdmin } = useAuth();
    const [schoolDetails, setSchoolDetails] = useState(null);
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch School Details (Dashboard Data)
    const fetchSchoolData = useCallback(async () => {
        if (!isSchoolAdmin) return; // Guard clause
        
        setLoading(true);
        try {
            const details = await schoolService.getMySchoolDetails();
            setSchoolDetails(details);
            
            const pending = await schoolService.getPendingTeachers();
            setPendingTeachers(pending);
        } catch (err) {
            console.error("Failed to load school data", err);
        } finally {
            setLoading(false);
        }
    }, [isSchoolAdmin]);

    // Load data on mount if user is a School Admin
    useEffect(() => {
        if (isSchoolAdmin) {
            fetchSchoolData();
        }
    }, [isSchoolAdmin, fetchSchoolData]);

    // 2. Action: Verify Teacher (Updates local list automatically)
    const verifyTeacher = async (teacherId) => {
        try {
            await schoolService.verifyTeacher(teacherId);
            // Remove the verified teacher from the local "pending" list
            setPendingTeachers(prev => prev.filter(t => t._id !== teacherId));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Verification failed" };
        }
    };

    // 3. Action: Create Student
    const createStudent = async (studentData) => {
        setLoading(true);
        try {
            await schoolService.createStudent(studentData);
            // Optional: You could re-fetch school details here to update student count
            await fetchSchoolData(); 
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Failed to create student" };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        schoolDetails,
        pendingTeachers,
        loading,
        fetchSchoolData,
        verifyTeacher,
        createStudent
    };

    return <SchoolAdminContext.Provider value={value}>{children}</SchoolAdminContext.Provider>;
};

export const useSchoolAdmin = () => useContext(SchoolAdminContext);