import express from "express";
import {
  createQuiz,
  getTeacherQuizzes,
  updateQuiz,
  deleteQuiz,
  getQuizzesByModule,
  getQuizById,
  submitQuiz,
  getStudentResults,
} from "../controllers/QuizController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import {
  createQuizSchema,
  updateQuizSchema,
  submitQuizSchema,
} from "../validators/QuizValidator.js";

const router = express.Router();

// Apply protection to ALL routes in this file
router.use(protect);

// --- Teacher Routes ---
router.post("/", restrictTo("teacher"), validate(createQuizSchema), createQuiz);
router.get("/my-quizzes", restrictTo("teacher"), getTeacherQuizzes);
router.put("/:id", restrictTo("teacher"), validate(updateQuizSchema), updateQuiz);
router.delete("/:id", restrictTo("teacher"), deleteQuiz);

// --- Student Routes ---
router.get("/results/my", restrictTo("student"), getStudentResults);
router.get("/module/:moduleId", getQuizzesByModule);
router.get("/:id", getQuizById);
router.post("/:id/submit", restrictTo("student"), validate(submitQuizSchema), submitQuiz);

export default router;