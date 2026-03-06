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

router.post(
    "/create-school",
    protect,
    restrictTo("super_admin"),
    createSchoolWithAdmin
);

router.get(
    "/schools", 
    protect, 
    restrictTo("super_admin"), 
    getAllSchools
);

router.get(
    "/schools/:id", 
    protect, 
    restrictTo("super_admin"), 
    getSchoolById
);

router.put(
    "/schools/:id", 
    protect, 
    restrictTo("super_admin"), 
    updateSchool
);

router.delete(
    "/schools/:id", 
    protect, 
    restrictTo("super_admin"), 
    deleteSchool
);

// ==========================================
// SUPER ADMIN: USER MANAGEMENT
// ==========================================

router.post(
    "/create-user", 
    protect, 
    restrictTo("super_admin"), 
    validate(createUserSchema), 
    createUser
);

router.get(
    "/users", 
    protect, 
    restrictTo("super_admin"), 
    getAllUsers
);

router.get(
    "/users/:id", 
    protect, 
    restrictTo("super_admin"), 
    getUserById
);

router.put(
    "/users/:id", 
    protect, 
    restrictTo("super_admin"), 
    validate(updateUserSchema), 
    updateUser
);

router.delete(
    "/users/:id", 
    protect, 
    restrictTo("super_admin"), 
    deleteUser
);

// --- User Status & Security Actions ---

router.patch(
    "/users/:id/toggle-status",
    protect,
    restrictTo("super_admin"),
    toggleUserStatus
);

router.patch(
    "/users/:id/toggle-lock",
    protect,
    restrictTo("super_admin"),
    toggleUserLock
);

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