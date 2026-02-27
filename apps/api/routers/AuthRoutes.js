import express from "express";
import { 
    login, 
    verifyFirstLoginOtp, // NEW
    setupNewPassword,    // NEW
    forgotPassword, 
    resetPassword, 
    logout, 
    me,
    refresh
} from "../controllers/AuthController.js"; // Ensure filename casing matches your system

import { protect } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { 
    loginSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema 
} from "../validators/AuthValidator.js";

const router = express.Router();

// --- Auth Routes ---

router.post(
    "/login", 
    validate(loginSchema), 
    login
);

// --- NEW: First-Login Flow Routes ---
router.post(
    "/verify-first-login-otp",
    verifyFirstLoginOtp
);

router.post(
    "/setup-new-password",
    setupNewPassword
);
// ------------------------------------

router.post(
    "/refresh", 
    refresh
);

router.post(
    "/forgot-password", 
    validate(forgotPasswordSchema), 
    forgotPassword
);

router.post(
    "/reset-password", 
    validate(resetPasswordSchema), 
    resetPassword
);

// Logout requires the user to be logged in (protected) to clear the session securely
router.post(
    "/logout", 
    protect, 
    logout
);

router.get(
    "/me", 
    protect, 
    me
);

export default router;