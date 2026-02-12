import express from "express";
import { createUser, getAllUsers, getUserById, updateUser, deleteUser, checkPhoneNumber, checkEmail } from "../controllers/AdminController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// --- Admin Routes ---
router.post("/create-user", createUser);
router.get("/users", protect, restrictTo("admin"), getAllUsers);
router.get("/users/:id", protect, restrictTo("admin"), getUserById);
router.put("/users/:id", protect, restrictTo("admin"), updateUser);
router.delete("/users/:id", protect, restrictTo("admin"), deleteUser);


// --- Utility Routes for Frontend Validation ---
router.post("/check-phone", protect, restrictTo("admin"), checkPhoneNumber);
router.post("/check-email", protect, restrictTo("admin"), checkEmail);

export default router;