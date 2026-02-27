import express from "express";
import { 
    createGrade, 
    getAllGrades, 
    getGradeById, 
    updateGrade, 
    deleteGrade 
} from "../controllers/GradeController.js"; 

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { createGradeSchema, updateGradeSchema } from "../validators/GradeValidator.js";

const router = express.Router();

// --- Grade Management Routes ---

router.route("/")
    .post(
        protect, 
        restrictTo("super_admin"), 
        validate(createGradeSchema), 
        createGrade
    )
    .get(
        protect, 
        getAllGrades
    );

router.route("/:id")
    .get(
        protect, 
        getGradeById
    )
    .put(
        protect, 
        restrictTo("super_admin"), 
        validate(updateGradeSchema), 
        updateGrade
    )
    .delete(
        protect, 
        restrictTo("super_admin"), 
        deleteGrade
    );

export default router;