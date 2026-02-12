import express from "express";
import { login, forgotPassword , resetPassword , logout } from "../controllers/AuthController.js";
import { protect } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// --- Auth Routes ---
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", protect, logout);

export default router;