import express from "express";
import { 
    createLevel, 
    getAllLevels, 
    getLevelById, 
    updateLevel, 
    deleteLevel 
} from "../controllers/LevelController.js"; // Ensure filename casing matches your system

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/Validate.js";
import { createLevelSchema, updateLevelSchema } from "../validators/LevelValidator.js";

const router = express.Router();

// --- Level Management Routes ---

router.route("/")
    // Create: Admin Only
    .post(
        protect, 
        restrictTo("admin"), 
        validate(createLevelSchema), 
        createLevel
    )
    // Read All: Authenticated Users (Admins, Teachers, etc.)
    .get(
        protect, 
        getAllLevels
    );

router.route("/:id")
    // Read One: Authenticated Users
    .get(
        protect, 
        getLevelById
    )
    // Update: Admin Only
    .put(
        protect, 
        restrictTo("admin"), 
        validate(updateLevelSchema), 
        updateLevel
    )
    // Delete: Admin Only
    .delete(
        protect, 
        restrictTo("admin"), 
        deleteLevel
    );

export default router;