import express from "express";
import { 
    createDonorProfile, 
    registerTeacher,
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
    registerTeacherSchema,
    updateUserProfileSchema, 
    updateUserPasswordSchema, 
    restoreUserSchema 
} from "../validators/UserValidator.js";

const router = express.Router();

// ==========================================
// --- PUBLIC ROUTES ---
// ==========================================

router.get("/schools", getPublicSchools);

router.post(
    "/register-donor",
    validate(createDonorSchema),
    createDonorProfile
);

router.post(
    "/register-teacher",
    validate(registerTeacherSchema),
    registerTeacher
);

router.post(
    "/restore", 
    validate(restoreUserSchema), 
    restoreUserProfile
);


// ==========================================
// --- PROTECTED ROUTES (Logged In Users) ---
// ==========================================

router.put(
    "/profile", 
    protect, 
    validate(updateUserProfileSchema), 
    updateUserProfile
);

router.put(
    "/update-password", 
    protect, 
    validate(updateUserPasswordSchema), 
    updateUserPassword
);

router.delete(
    "/profile", 
    protect, 
    deleteUserProfile
);

export default router;