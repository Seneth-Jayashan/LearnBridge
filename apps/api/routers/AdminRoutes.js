import express from "express";
import { 
    createUser, 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser, 
    checkPhoneNumber, 
    checkEmail,
    createSchoolWithAdmin,
    toggleUserStatus,
    toggleUserLock,
    restoreUser,
    // --- New School Controller Imports ---
    getAllSchools,
    getSchoolById,
    updateSchool,
    deleteSchool
} from "../controllers/AdminController.js"; 

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { 
    createUserSchema, 
    updateUserSchema, 
    checkPhoneSchema, 
    checkEmailSchema 
} from "../validators/AdminValidator.js";

const router = express.Router();

// ==========================================
// SUPER ADMIN: SCHOOL MANAGEMENT
// ==========================================

// Create a new School along with its School Admin
router.post(
    "/create-school",
    protect,
    restrictTo("super_admin"),
    createSchoolWithAdmin
);

// Get All Schools
router.get(
    "/schools", 
    protect, 
    restrictTo("super_admin"), 
    getAllSchools
);

// Get Single School by ID
router.get(
    "/schools/:id", 
    protect, 
    restrictTo("super_admin"), 
    getSchoolById
);

// Update School
router.put(
    "/schools/:id", 
    protect, 
    restrictTo("super_admin"), 
    updateSchool
);

// Delete School
router.delete(
    "/schools/:id", 
    protect, 
    restrictTo("super_admin"), 
    deleteSchool
);

// ==========================================
// SUPER ADMIN: USER MANAGEMENT
// ==========================================

// Create User
router.post(
    "/create-user", 
    protect, 
    restrictTo("super_admin"), 
    validate(createUserSchema), 
    createUser
);

// Get All Users
router.get(
    "/users", 
    protect, 
    restrictTo("super_admin"), 
    getAllUsers
);

// Get Single User by ID
router.get(
    "/users/:id", 
    protect, 
    restrictTo("super_admin"), 
    getUserById
);

// Update User
router.put(
    "/users/:id", 
    protect, 
    restrictTo("super_admin"), 
    validate(updateUserSchema), 
    updateUser
);

// Delete User (Soft delete based on controller)
router.delete(
    "/users/:id", 
    protect, 
    restrictTo("super_admin"), 
    deleteUser
);

// --- User Status & Security Actions ---

// Toggle Active/Inactive Status
router.patch(
    "/users/:id/toggle-status",
    protect,
    restrictTo("super_admin"),
    toggleUserStatus
);

// Toggle Locked/Unlocked Status
router.patch(
    "/users/:id/toggle-lock",
    protect,
    restrictTo("super_admin"),
    toggleUserLock
);

// Restore a previously deleted user
router.patch(
    "/users/:id/restore",
    protect,
    restrictTo("super_admin"),
    restoreUser
);

// ==========================================
// UTILITY ROUTES (For Frontend Validation)
// ==========================================

router.post(
    "/check-phone", 
    protect, 
    restrictTo("super_admin"), 
    validate(checkPhoneSchema), 
    checkPhoneNumber
);

router.post(
    "/check-email", 
    protect, 
    restrictTo("super_admin"), 
    validate(checkEmailSchema), 
    checkEmail
);

export default router;