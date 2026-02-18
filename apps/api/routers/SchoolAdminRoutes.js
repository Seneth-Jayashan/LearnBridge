import express from "express";
import { 
    createStudentForSchool, 
    verifySchoolTeacher,
    getPendingTeachers,
    getMySchoolDetails
} from "../controllers/SchoolAdminController.js"; 

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js"; // Import Validate Middleware
import { createStudentSchema } from "../validators/SchoolAdminValidator.js"; // Import Schema

const router = express.Router();

// Apply protection to ALL routes in this file
router.use(protect);
router.use(restrictTo("school_admin")); 

// --- School Management Routes ---

// Get Dashboard Data
router.get("/my-school", getMySchoolDetails);

// Student Management - NOW VALIDATED
router.post(
    "/create-student", 
    validate(createStudentSchema), 
    createStudentForSchool
);

// Teacher Verification Flow
router.get("/teachers/pending", getPendingTeachers); // View list
router.patch("/teachers/verify/:teacherId", verifySchoolTeacher); // Approve specific teacher

export default router;