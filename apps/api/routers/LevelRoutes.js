import express from "express";
import { 
    createLevel, 
    getAllLevels, 
    getLevelById, 
    updateLevel, 
    deleteLevel,
    seedDefaultLevels
} from "../controllers/LevelController.js"; // Ensure filename casing matches your system

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { createLevelSchema, updateLevelSchema } from "../validators/LevelValidator.js";

const router = express.Router();

// --- Level Management Routes ---

/*
    Level Routes
    - Seed endpoint and write operations are restricted to `super_admin`.
    - Listing and retrieval require authentication.
    - `validate` middleware ensures payloads conform to expected schemas.
*/

router.post(
    "/seed-defaults",
    protect,
    restrictTo("super_admin"),
    seedDefaultLevels
);

router.route("/")
    // Create: super_admin Only
    .post(
        protect, 
        restrictTo("super_admin"), 
        validate(createLevelSchema), 
        createLevel
    )
    // Read All: Authenticated Users (super_admins, Teachers, etc.)
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
    // Update: super_admin Only
    .put(
        protect, 
        restrictTo("super_admin"), 
        validate(updateLevelSchema), 
        updateLevel
    )
    // Delete: super_admin Only
    .delete(
        protect, 
        restrictTo("super_admin"), 
        deleteLevel
    );

export default router;