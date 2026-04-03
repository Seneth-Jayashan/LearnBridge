import express from "express";
import { 
    getMySchoolDetails,
    updateSchoolProfile,
    createStudentForSchool, 
    createTeacherForSchool,
    getSchoolStudents,
    updateSchoolStudent,
    deactivateStudent,
    getPendingTeachers,
    createNeed,
    getMyPostedNeeds,
    updateNeed,
    deleteNeed,
    getVerifiedTeachers,
    verifySchoolTeacher,
    removeTeacherFromSchool
} from "../controllers/SchoolAdminController.js"; 

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { createStudentSchema } from "../validators/SchoolAdminValidator.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("school_admin")); 

// ==========================================
// --- SCHOOL PROFILE ---
// ==========================================
router.get("/my-school", getMySchoolDetails);
router.put("/my-school", updateSchoolProfile);

// ==========================================
// --- STUDENT MANAGEMENT ---
// ==========================================
router.get("/students", getSchoolStudents);

router.post(
    "/students", 
    validate(createStudentSchema), 
    createStudentForSchool
);

router.put("/students/:studentId", updateSchoolStudent);
router.patch("/students/:studentId/deactivate", deactivateStudent);

// ==========================================
// --- TEACHER MANAGEMENT ---
// ==========================================
router.post("/teachers", createTeacherForSchool);

router.get("/teachers", getVerifiedTeachers);
router.get("/teachers/pending", getPendingTeachers);

router.patch("/teachers/:teacherId/verify", verifySchoolTeacher);
router.delete("/teachers/:teacherId/remove", removeTeacherFromSchool);

// ── School Admin Routes (Needs Registry CRUD) ──────────────────
router.post("/needs", protect, restrictTo("school_admin"), createNeed);
router.get("/school/my-needs", protect, restrictTo("school_admin"), getMyPostedNeeds);
router.put("/school/:id", protect, restrictTo("school_admin"), updateNeed);
router.delete("/school/:id", protect, restrictTo("school_admin"), deleteNeed);

export default router;