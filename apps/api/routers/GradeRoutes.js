import express from "express";
import { 
    createGrade, 
    getAllGrades, 
    getGradeById, 
    updateGrade, 
    deleteGrade 
} from "../controllers/GradeController.js"; // Ensure filename casing matches your system

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { createGradeSchema, updateGradeSchema } from "../validators/GradeValidator.js";

const router = express.Router();

// --- Grade Management Routes ---

router.post(
    "/seed-defaults",
    protect,
    restrictTo("super_admin"),
    seedDefaultGrades
);

router.route("/")
    // Create: super_admin Only
    .post(
        protect, 
        restrictTo("super_admin"), 
        validate(createGradeSchema), 
        createGrade
    )
    // Read All: Authenticated Users (super_admins, Teachers, etc.)
    .get(
        protect, 
        getAllGrades
    );

router.route("/:id")
    // Read One: Authenticated Users
    .get(
        protect, 
        getGradeById
    )
    // Update: super_admin Only
    .put(
        protect, 
        restrictTo("super_admin"), 
        validate(updateGradeSchema), 
        updateGrade
    )
    // Delete: super_admin Only
    .delete(
        protect, 
        restrictTo("super_admin"), 
        deleteGrade
    );

export default router;