import express from "express";
import { generateQuestionsFromPDF } from "../controllers/PdfController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import upload from "../middlewares/UploadMiddleware.js";

const router = express.Router();

//accepts a FILE called "pdf"
router.post(
  "/generate-from-pdf",
  protect,
  restrictTo("teacher"),
  upload.single("pdf"),   
  generateQuestionsFromPDF
);

export default router;