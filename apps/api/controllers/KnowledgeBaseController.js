import mongoose from "mongoose";
import KnowledgeBase from "../models/KnowledgeBase.js";
import Lesson from "../models/Lesson.js";
import {
  uploadFileToCloudinary,
  deleteCloudinaryAssetFromUrl,
  createSignedDownloadUrlFromCloudinaryUrl,
  getCloudinaryFileNameFromUrl,
} from "../services/CloudinaryService.js";

// Escape user input for safe use inside RegExp objects.
const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Convert a value to a nullable ObjectId (or return null for falsy/invalid values).
const toNullableObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

// Authorization helper: determine whether the `user` may manage (edit/delete)
// the knowledge base `entry`.
const canManageEntry = (user, entry) => {
  if (user.role === "super_admin") return true;

  if (user.role === "school_admin") {
    return (
      Boolean(user.school) &&
      Boolean(entry.school) &&
      user.school.toString() === entry.school.toString()
    );
  }

  if (user.role === "teacher") {
    return entry.createdBy.toString() === user._id.toString();
  }

  return false;
};

// Build a MongoDB text search filter for title/content/category using regex.
const buildQueryFilter = (q) => {
  if (!q || !String(q).trim()) return {};
  const regex = new RegExp(escapeRegExp(String(q).trim()), "i");
  return {
    $or: [{ title: regex }, { content: regex }, { category: regex }],
  };
};

// Public listing of published knowledge-base entries with optional search.
export const getPublicKnowledgeBaseEntries = async (req, res) => {
  try {
    const filter = { isPublished: true, ...buildQueryFilter(req.query?.q) };
    const entries = await KnowledgeBase.find(filter)
      .populate("createdBy", "firstName lastName")
      .sort({ updatedAt: -1 });

    return res.status(200).json(entries);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Return knowledge-base entries visible to the authenticated user.
export const getKnowledgeBaseEntries = async (req, res) => {
  try {
    const searchFilter = buildQueryFilter(req.query?.q);
    const query = { ...searchFilter };

    if (req.user.role === "teacher") {
      query.createdBy = req.user._id;
    } else if (req.user.role === "school_admin" && req.user.school) {
      query.school = req.user.school;
    }

    const entries = await KnowledgeBase.find(query)
      .populate("createdBy", "firstName lastName role")
      .sort({ updatedAt: -1 });

    return res.status(200).json(entries);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a knowledge-base entry. Handles optional attachment uploads
// (multiple files) and stores their secure URLs on the document.
export const createKnowledgeBaseEntry = async (req, res) => {
  try {
    let attachmentUrl = [];
    const attachmentFiles = Array.isArray(req.files?.attachment) ? req.files.attachment : [];
    if (attachmentFiles.length) {
      try {
        const uploads = [];
        for (const f of attachmentFiles) {
          const up = await uploadFileToCloudinary(f, {
            folder: "learnbridge/knowledge-base/attachments",
            resourceType: "auto",
          });
          if (up?.secure_url) uploads.push(up.secure_url);
        }
        attachmentUrl = uploads;
      } catch (uploadErr) {
        return res.status(400).json({ message: `Failed to upload attachment: ${uploadErr.message}` });
      }
    }

    const entry = await KnowledgeBase.create({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category?.trim() || "General",
      attachmentUrl,
      isPublished: req.body.isPublished ?? true,
      createdBy: req.user._id,
      school: toNullableObjectId(req.user.school),
    });

    return res.status(201).json({ message: "Knowledge base entry created", entry });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update an entry. Validates permissions and replaces attachments when new
// files are provided (removing old attachments from Cloudinary where possible).
export const updateKnowledgeBaseEntry = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Knowledge base entry not found" });
    }

    if (!canManageEntry(req.user, entry)) {
      return res.status(403).json({ message: "You do not have permission to update this entry" });
    }

    if (req.body.title !== undefined) entry.title = req.body.title;
    if (req.body.content !== undefined) entry.content = req.body.content;
    if (req.body.category !== undefined) entry.category = req.body.category || "General";
    if (req.body.isPublished !== undefined) entry.isPublished = req.body.isPublished;

    const attachmentFiles = Array.isArray(req.files?.attachment) ? req.files.attachment : [];
    if (attachmentFiles.length) {

      // Attempt to delete any previously stored attachments to avoid orphaned assets.
      if (Array.isArray(entry.attachmentUrl) && entry.attachmentUrl.length) {
        for (const prev of entry.attachmentUrl) {
          try {
            await deleteCloudinaryAssetFromUrl(prev);
          } catch {
            // Ignore deletion failures; proceed with updating attachment list.
          }
        }
      } else if (entry.attachmentUrl) {
        try {
          await deleteCloudinaryAssetFromUrl(entry.attachmentUrl);
        } catch {}
      }

      try {
        const uploads = [];
        for (const f of attachmentFiles) {
          const up = await uploadFileToCloudinary(f, {
            folder: "learnbridge/knowledge-base/attachments",
            resourceType: "auto",
          });
          if (up?.secure_url) uploads.push(up.secure_url);
        }
        entry.attachmentUrl = uploads;
      } catch (uploadErr) {
        return res.status(400).json({ message: `Failed to upload attachment: ${uploadErr.message}` });
      }
    }

    await entry.save();

    return res.status(200).json({ message: "Knowledge base entry updated", entry });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete an entry and its attachments (unless those attachments are referenced
// elsewhere, e.g., by lessons). Permissions are validated before deletion.
export const deleteKnowledgeBaseEntry = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Knowledge base entry not found" });
    }

    if (!canManageEntry(req.user, entry)) {
      return res.status(403).json({ message: "You do not have permission to delete this entry" });
    }

    const attachments = Array.isArray(entry.attachmentUrl)
      ? entry.attachmentUrl
      : (entry.attachmentUrl ? [entry.attachmentUrl] : []);

    if (attachments.length) {
      // Find lessons which reference these media URLs to avoid deleting shared assets.
      const referencedLessons = await Lesson.find({
        $or: [
          { materialUrl: { $in: attachments } },
          { videoUrl: { $in: attachments } },
        ],
      }).select("materialUrl videoUrl");

      const referencedMediaUrls = new Set();
      referencedLessons.forEach((lesson) => {
        if (lesson.materialUrl) referencedMediaUrls.add(lesson.materialUrl);
        if (lesson.videoUrl) referencedMediaUrls.add(lesson.videoUrl);
      });

      for (const mediaUrl of attachments) {
        if (referencedMediaUrls.has(mediaUrl)) {
          continue;
        }
        try {
          await deleteCloudinaryAssetFromUrl(mediaUrl);
        } catch {
          // Ignore Cloudinary deletion errors.
        }
      }
    }

    await KnowledgeBase.deleteOne({ _id: entry._id });

    return res.status(200).json({ message: "Knowledge base entry deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Public endpoint to generate a signed download URL for a specific attachment
// (by index) on a published knowledge-base entry.
export const getKnowledgeBaseAttachmentDownloadUrlPublic = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Knowledge base entry not found" });
    }

    if (!entry.isPublished) {
      return res.status(403).json({ message: "Article is not public" });
    }

    const index = Number(req.query?.index || 0) || 0;
    const attachments = Array.isArray(entry.attachmentUrl) ? entry.attachmentUrl : (entry.attachmentUrl ? [entry.attachmentUrl] : []);

    if (!attachments.length || !attachments[index]) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const selected = attachments[index];
    const fileName = getCloudinaryFileNameFromUrl(selected) || `attachment_${index + 1}`;
    const downloadUrl = createSignedDownloadUrlFromCloudinaryUrl(selected, {
      expiresInSeconds: 300,
      fileName,
    });

    return res.status(200).json({ downloadUrl, fileName, index });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
