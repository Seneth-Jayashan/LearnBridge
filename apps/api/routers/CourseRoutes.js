import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/CourseController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { uploadCourseMedia } from "../middlewares/UploadMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../validators/CourseValidator.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(
    restrictTo("teacher", "school_admin", "super_admin"),
    uploadCourseMedia,
    validate(createCourseSchema),
    createCourse,
  )
  .get(getAllCourses);

router
  .route("/:id")
  .get(getCourseById)
  .put(
    restrictTo("teacher", "school_admin", "super_admin"),
    uploadCourseMedia,
    validate(updateCourseSchema),
    updateCourse,
  )
  .delete(restrictTo("teacher", "school_admin", "super_admin"), deleteCourse);

export default router;