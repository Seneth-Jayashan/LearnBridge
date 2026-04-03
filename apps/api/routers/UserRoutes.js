import express from "express";
import { 
    createDonorProfile, // Import the new function
    updateUserProfile, 
    updateUserPassword, 
    deleteUserProfile, 
    restoreUserProfile,
} from "../controllers/UserController.js";

import { protect } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { 
    createDonorSchema, // Import the new schema
    updateUserProfileSchema, 
    updateUserPasswordSchema, 
    restoreUserSchema 
} from "../validators/UserValidator.js";

const router = express.Router();

// --- Public Routes ---

// Register Donor (No protection needed, anyone can sign up)
router.post(
    "/register-donor",
    validate(createDonorSchema),
    createDonorProfile
);

// Restore Account (Public)
router.post(
    "/restore", 
    validate(restoreUserSchema), 
    restoreUserProfile
);


// --- Protected Routes (Logged In Users) ---

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