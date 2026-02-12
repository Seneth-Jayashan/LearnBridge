import express from "express";
import { 
    createGrade, 
    getAllGrades, 
    getGradeById, 
    updateGrade, 
    deleteGrade 
} from "../controllers/GradeController.js"; // Ensure filename casing matches your system

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/Validate.js";
import { createGradeSchema, updateGradeSchema } from "../validators/GradeValidator.js";

const router = express.Router();

// --- Grade Management Routes ---

router.route("/")
    // Create: Admin Only
    .post(
        protect, 
        restrictTo("admin"), 
        validate(createGradeSchema), 
        createGrade
    )
    // Read All: Authenticated Users (Admins, Teachers, etc.)
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
    // Update: Admin Only
    .put(
        protect, 
        restrictTo("admin"), 
        validate(updateGradeSchema), 
        updateGrade
    )
    // Delete: Admin Only
    .delete(
        protect, 
        restrictTo("admin"), 
        deleteGrade
    );

export default router;