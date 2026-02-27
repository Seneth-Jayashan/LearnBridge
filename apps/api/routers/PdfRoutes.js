import express from "express";
import { generateQuestionsFromPDF } from "../controllers/PdfController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.post("/generate-from-pdf", protect, restrictTo("teacher"), generateQuestionsFromPDF);

export default router;