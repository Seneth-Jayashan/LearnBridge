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

router.post(
    "/seed-defaults",
    protect,
    restrictTo("super_admin"),
    seedDefaultLevels
);

router.route("/")
    .post(
        protect, 
        restrictTo("super_admin"), 
        validate(createLevelSchema), 
        createLevel
    )
    .get(
        protect, 
        getAllLevels
    );

router.route("/:id")
    .get(
        protect, 
        getLevelById
    )
    .put(
        protect, 
        restrictTo("super_admin"), 
        validate(updateLevelSchema), 
        updateLevel
    )
    .delete(
        protect, 
        restrictTo("super_admin"), 
        deleteLevel
    );

export default router;