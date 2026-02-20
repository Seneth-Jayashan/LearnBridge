import express from "express";
import {
  createQuiz,
  getTeacherQuizzes,
  updateQuiz,
  deleteQuiz,
  getQuizzesByCourse,
  getQuizById,
  submitQuiz,
  getStudentResults,
} from "../controllers/QuizController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Apply protection to ALL routes in this file
router.use(protect);

// --- Teacher Routes ---
router.post("/", restrictTo("teacher"), createQuiz);
router.get("/my-quizzes", restrictTo("teacher"), getTeacherQuizzes);
router.put("/:id", restrictTo("teacher"), updateQuiz);
router.delete("/:id", restrictTo("teacher"), deleteQuiz);

// --- Student Routes ---
router.get("/results/my", restrictTo("student"), getStudentResults);
router.get("/course/:courseId", getQuizzesByCourse);
router.get("/:id", getQuizById);
router.post("/:id/submit", restrictTo("student"), submitQuiz);

export default router;
