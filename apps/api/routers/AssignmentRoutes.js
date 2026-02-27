import express from "express";
import {
  createAssignment,
  deleteAssignment,
  getAllAssignments,
  getAssignmentById,
  getAssignmentMaterialDownloadUrl,
  getAssignmentSubmissionDownloadUrl,
  getAssignmentSubmissions,
  getMyAssignmentSubmission,
  submitAssignment,
  updateAssignment,
} from "../controllers/AssignmentController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { uploadAssignmentFiles } from "../middlewares/UploadMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import {
  createAssignmentSchema,
  submitAssignmentSchema,
  updateAssignmentSchema,
} from "../validators/AssignmentValidator.js";

const router = express.Router();

/*
  Assignment Routes
  - All routes are protected by `protect` (applied below).
  - Teachers/school_admins/super_admins may create/update/delete assignments.
  - Students may submit to `/:id/submit` and view their own submission.
  - File uploads for creation/submission use `uploadAssignmentFiles` middleware.
  - Validation schemas ensure request payloads are well-formed.
*/

router.use(protect);

router
  .route("/")
  .post(
    restrictTo("teacher", "school_admin", "super_admin"),
    uploadAssignmentFiles,
    validate(createAssignmentSchema),
    createAssignment,
  )
  .get(getAllAssignments);

router.route("/:id/material-download").get(getAssignmentMaterialDownloadUrl);
router
  .route("/:id/submit")
  .post(restrictTo("student"), uploadAssignmentFiles, validate(submitAssignmentSchema), submitAssignment);
router.route("/:id/my-submission").get(restrictTo("student"), getMyAssignmentSubmission);
router
  .route("/:id/submissions")
  .get(restrictTo("teacher", "school_admin", "super_admin"), getAssignmentSubmissions);

router
  .route("/:id/submissions/:submissionId/download")
  .get(restrictTo("teacher", "school_admin", "super_admin"), getAssignmentSubmissionDownloadUrl);

router
  .route("/:id")
  .get(getAssignmentById)
  .put(
    restrictTo("teacher", "school_admin", "super_admin"),
    uploadAssignmentFiles,
    validate(updateAssignmentSchema),
    updateAssignment,
  )
  .delete(restrictTo("teacher", "school_admin", "super_admin"), deleteAssignment);

export default router;
