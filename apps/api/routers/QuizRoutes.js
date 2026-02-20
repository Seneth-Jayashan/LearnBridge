import express from "express";
import {
  createQuiz, getTeacherQuizzes, updateQuiz, deleteQuiz,
  getQuizzesByCourse, getQuizById, submitQuiz, getStudentResults
} from "../controllers/quiz.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Teacher routes
router.post("/", protect, authorizeRoles("teacher"), createQuiz);
router.get("/my-quizzes", protect, authorizeRoles("teacher"), getTeacherQuizzes);
router.put("/:id", protect, authorizeRoles("teacher"), updateQuiz);
router.delete("/:id", protect, authorizeRoles("teacher"), deleteQuiz);

// Student routes
router.get("/course/:courseId", protect, getQuizzesByCourse);
router.get("/:id", protect, getQuizById);
router.post("/:id/submit", protect, authorizeRoles("student"), submitQuiz);
router.get("/results/my", protect, authorizeRoles("student"), getStudentResults);

export default router;