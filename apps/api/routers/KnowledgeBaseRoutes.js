import express from "express";
import {
  createKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  getKnowledgeBaseEntries,
  getPublicKnowledgeBaseEntries,
  updateKnowledgeBaseEntry,
} from "../controllers/KnowledgeBaseController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import { uploadKBAttachment } from "../middlewares/UploadMiddleware.js";
import {
  createKnowledgeBaseSchema,
  updateKnowledgeBaseSchema,
} from "../validators/KnowledgeBaseValidator.js";

const router = express.Router();

router.get("/public", getPublicKnowledgeBaseEntries);

// Public attachment download for published entries
router.get("/public/:id/attachment-download", async (req, res, next) => {
  try {
    const mod = await import("../controllers/KnowledgeBaseController.js");
    if (mod && typeof mod.getKnowledgeBaseAttachmentDownloadUrlPublic === "function") {
      return mod.getKnowledgeBaseAttachmentDownloadUrlPublic(req, res);
    }
    return res.status(500).json({ message: "Handler not available" });
  } catch (err) {
    return next(err);
  }
});

/*
  Knowledge Base Routes
  - Public endpoints (e.g. `/public`) return published entries without auth.
  - Public attachment download uses a dynamic controller import to keep
    signing/Cloudinary helpers separate from public route setup.
  - Remaining endpoints are protected and restricted to teacher/school_admin/super_admin
    for creation, updates, and deletion. Attachments use `uploadKBAttachment`.
*/

router.use(protect);

router
  .route("/")
  .get(restrictTo("teacher", "school_admin", "super_admin"), getKnowledgeBaseEntries)
  .post(
    restrictTo("teacher", "school_admin", "super_admin"),
    uploadKBAttachment,
    validate(createKnowledgeBaseSchema),
    createKnowledgeBaseEntry,
  );

router
  .route("/:id")
  .put(
    restrictTo("teacher", "school_admin", "super_admin"),
    uploadKBAttachment,
    validate(updateKnowledgeBaseSchema),
    updateKnowledgeBaseEntry,
  )
  .delete(restrictTo("teacher", "school_admin", "super_admin"), deleteKnowledgeBaseEntry);

export default router;
