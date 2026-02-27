import express from "express";
import { 
    login, 
    verifyFirstLoginOtp,
    setupNewPassword, 
    forgotPassword, 
    resetPassword, 
    logout, 
    me,
    refresh
} from "../controllers/AuthController.js";

import { protect } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { 
    loginSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema 
} from "../validators/AuthValidator.js";

const router = express.Router();


router.post(
    "/login", 
    validate(loginSchema), 
    login
);

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