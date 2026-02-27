import mongoose from "mongoose";
import KnowledgeBase from "../models/KnowledgeBase.js";
import {
  uploadFileToCloudinary,
  deleteCloudinaryAssetFromUrl,
  createSignedDownloadUrlFromCloudinaryUrl,
  getCloudinaryFileNameFromUrl,
} from "../services/CloudinaryService.js";

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNullableObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

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

const buildQueryFilter = (q) => {
  if (!q || !String(q).trim()) return {};
  const regex = new RegExp(escapeRegExp(String(q).trim()), "i");
  return {
    $or: [{ title: regex }, { summary: regex }, { content: regex }, { category: regex }],
  };
};

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

export const createKnowledgeBaseEntry = async (req, res) => {
  try {
    let attachmentUrl = "";
    const attachmentFile = req.files?.attachment?.[0];
    if (attachmentFile) {
      try {
        const upload = await uploadFileToCloudinary(attachmentFile, {
          folder: "learnbridge/knowledge-base/attachments",
          resourceType: "auto",
        });
        attachmentUrl = upload?.secure_url || "";
      } catch (uploadErr) {
        return res.status(400).json({ message: `Failed to upload attachment: ${uploadErr.message}` });
      }
    }

    const entry = await KnowledgeBase.create({
      title: req.body.title,
      summary: req.body.summary ?? "",
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
    if (req.body.summary !== undefined) entry.summary = req.body.summary;
    if (req.body.content !== undefined) entry.content = req.body.content;
    if (req.body.category !== undefined) entry.category = req.body.category || "General";
    if (req.body.isPublished !== undefined) entry.isPublished = req.body.isPublished;

    // Handle attachment replacement
    const attachmentFile = req.files?.attachment?.[0];
    if (attachmentFile) {
      // delete previous cloudinary asset if present (best-effort)
      if (entry.attachmentUrl) {
        try {
          await deleteCloudinaryAssetFromUrl(entry.attachmentUrl);
        } catch {
          // ignore deletion errors
        }
      }

      try {
        const upload = await uploadFileToCloudinary(attachmentFile, {
          folder: "learnbridge/knowledge-base/attachments",
          resourceType: "auto",
        });
        entry.attachmentUrl = upload?.secure_url || entry.attachmentUrl;
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

export const deleteKnowledgeBaseEntry = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Knowledge base entry not found" });
    }

    if (!canManageEntry(req.user, entry)) {
      return res.status(403).json({ message: "You do not have permission to delete this entry" });
    }

    await KnowledgeBase.deleteOne({ _id: entry._id });

    return res.status(200).json({ message: "Knowledge base entry deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getKnowledgeBaseAttachmentDownloadUrlPublic = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Knowledge base entry not found" });
    }

    if (!entry.isPublished) {
      return res.status(403).json({ message: "Article is not public" });
    }

    if (!entry.attachmentUrl) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const fileName = getCloudinaryFileNameFromUrl(entry.attachmentUrl) || "attachment";
    const downloadUrl = createSignedDownloadUrlFromCloudinaryUrl(entry.attachmentUrl, {
      expiresInSeconds: 300,
      fileName,
    });

    return res.status(200).json({ downloadUrl, fileName });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
