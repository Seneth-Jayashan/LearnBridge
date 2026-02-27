import express from "express";
import {
  createLesson,
  getAllLessons,
  getLessonById,
  getLessonMaterialDownloadUrl,
  updateLesson,
  deleteLesson,
} from "../controllers/LessonController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { uploadLessonMedia } from "../middlewares/UploadMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import {
  createLessonSchema,
  updateLessonSchema,
} from "../validators/LessonValidator.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(
    restrictTo("teacher", "school_admin", "super_admin"),
    uploadLessonMedia,
    validate(createLessonSchema),
    createLesson,
  )
  .get(getAllLessons);

router.route("/:id/material-download").get(getLessonMaterialDownloadUrl);

router
  .route("/:id")
  .get(getLessonById)
  .put(
    restrictTo("teacher", "school_admin", "super_admin"),
    uploadLessonMedia,
    validate(updateLessonSchema),
    updateLesson,
  )
  .delete(restrictTo("teacher", "school_admin", "super_admin"), deleteLesson);

export default router;
