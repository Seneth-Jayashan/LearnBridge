import express from "express";
import { 
    createDonorProfile, 
    registerTeacher, // --- NEW IMPORT ---
    updateUserProfile, 
    updateUserPassword, 
    deleteUserProfile, 
    restoreUserProfile 
} from "../controllers/UserController.js"; 

import { getPublicSchools } from "../controllers/SchoolController.js";

import { protect } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { 
    createDonorSchema, 
    registerTeacherSchema, // --- NEW IMPORT (Make sure you add this to UserValidator.js!) ---
    updateUserProfileSchema, 
    updateUserPasswordSchema, 
    restoreUserSchema 
} from "../validators/UserValidator.js";

const router = express.Router();

// ==========================================
// --- PUBLIC ROUTES ---
// ==========================================

router.get("/schools", getPublicSchools);

// Register Donor (Anyone can sign up to donate)
router.post(
    "/register-donor",
    validate(createDonorSchema),
    createDonorProfile
);

// Register Teacher (Teachers sign up, then await School Admin verification if affiliated)
router.post(
    "/register-teacher",
    validate(registerTeacherSchema),
    registerTeacher
);

// Restore Account 
router.post(
    "/restore", 
    validate(restoreUserSchema), 
    restoreUserProfile
);


// ==========================================
// --- PROTECTED ROUTES (Logged In Users) ---
// ==========================================

// Update Profile Details
router.put(
    "/profile", 
    protect, 
    validate(updateUserProfileSchema), 
    updateUserProfile
);

// Update Password
router.put(
    "/update-password", 
    protect, 
    validate(updateUserPasswordSchema), 
    updateUserPassword
);

// Soft Delete Account
router.delete(
    "/profile", 
    protect, 
    deleteUserProfile
);

export default router;