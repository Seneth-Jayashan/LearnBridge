import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import { createZoomMeeting } from "../services/ZoomService.js";
import {
  createSignedDownloadUrlFromCloudinaryUrl,
  deleteCloudinaryAssetFromUrl,
  getCloudinaryFileNameFromUrl,
  uploadFileToCloudinary,
} from "../services/CloudinaryService.js";

/*
  LessonController
  - Responsibility: handle lesson CRUD, resource uploads (documents/videos),
    online meeting creation (Zoom), and resource download URL generation.
  - Important behaviors:
    * Role-based permission helpers (`canManageLesson`, `canViewLesson`) enforce
      who can read/modify lessons.
    * Files uploaded in request (`req.files`) are stored in Cloudinary via
      `uploadFileToCloudinary` and cleaned up when replaced/deleted via
      `deleteCloudinaryAssetFromCloudinary`.
    * For student users, listing and retrieval are filtered by the student's
      grade and school so they only access lessons intended for them.
*/

const canManageLesson = (user, lesson) => {
  if (user.role === "super_admin") return true;

  if (user.role === "school_admin") {
    return (
      user.school &&
      lesson.school &&
      user.school.toString() === lesson.school.toString()
    );
  }

  if (user.role === "teacher") {
    return lesson.createdBy.toString() === user._id.toString();
  }

  return false;
};

// Permission helper: who may manage (create/update/delete) a lesson
// - Super admins may manage everything
// - School admins may manage lessons belonging to their school
// - Teachers may manage lessons they created

const canViewLesson = (user, lesson) => {
  if (canManageLesson(user, lesson)) return true;

  if (user.role === "student") {
    return (
      Boolean(user.grade) &&
      Boolean(lesson?.module?.grade) &&
      user.grade.toString() === lesson.module.grade.toString()
    );
  }

  return false;
};

// Permission helper: who may view a lesson
// - Managers (super_admin/school_admin/creator-teacher) can view
// - Students can view when their grade matches the lesson's module grade

const toNullableObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

// Convert a value to an ObjectId-compatible value or null.
// Used to normalize optional `school` references coming from the user.

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Escape user-supplied strings for safe RegExp usage when filtering/searching

const ensureHasResource = (materialUrl, videoUrl) => Boolean(materialUrl || videoUrl);
const isTruthy = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
};

// Ensure lesson contains at least one resource (document or video)
// Interpret various forms of booleans coming from requests (form toggles, strings)

const buildOnlineMeeting = async ({ title, description, createMeeting, startTime }) => {
  if (!createMeeting) return null;

  const zoomMeeting = await createZoomMeeting({
    topic: title,
    agenda: description || "",
    startTime,
  });

  return {
    provider: "zoom",
    meetingId: zoomMeeting.id ? String(zoomMeeting.id) : "",
    joinUrl: zoomMeeting.join_url || "",
    startUrl: zoomMeeting.start_url || "",
    password: zoomMeeting.password || "",
    startTime: zoomMeeting.start_time || startTime,
    duration: Number(zoomMeeting.duration) || 60,
    title,
    description: description || "",
  };
};

// Build an online meeting object by calling the Zoom service when requested.
// Returns `null` when no meeting should be created.

export const createLesson = async (req, res) => {
  // Create a lesson
  // Steps:
  // 1. Read fields and files from the request
  // 2. Upload files (material/video) to Cloudinary when provided
  // 3. Validate module exists and that lesson has at least one resource
  // 4. Optionally create a Zoom meeting and attach meeting metadata
  // 5. Persist lesson with `createdBy` and optional `school` reference
  // 6. Return created lesson and any onlineMeeting payload

  try {
    const {
      title,
      description,
      module,
      materialUrl,
      videoUrl,
      createZoomMeeting,
      zoomStartTime,
      onlineMeetingStartTime,
    } = req.body;

    const materialFile = req.files?.material?.[0] || req.files?.materialUrl?.[0];
    const videoFile = req.files?.video?.[0] || req.files?.videoUrl?.[0];
    let uploadedMaterialUrl = "";
    let uploadedVideoUrl = "";

    if (materialFile) {
      const materialUpload = await uploadFileToCloudinary(materialFile, {
        folder: "learnbridge/lessons/materials",
        resourceType: "raw",
      });
      uploadedMaterialUrl = materialUpload.secure_url || "";
    }

    if (videoFile) {
      const videoUpload = await uploadFileToCloudinary(videoFile, {
        folder: "learnbridge/lessons/videos",
        resourceType: "video",
      });
      uploadedVideoUrl = videoUpload.secure_url || "";
    }

    const selectedModule = await Module.findById(module);

    if (!selectedModule) {
      return res.status(404).json({ message: "Module not found" });
    }

    const nextMaterialUrl = uploadedMaterialUrl || materialUrl || "";
    const nextVideoUrl = uploadedVideoUrl || videoUrl || "";

    if (!ensureHasResource(nextMaterialUrl, nextVideoUrl)) {
      return res.status(400).json({
        message: "Please upload at least one lesson resource (document or video)",
      });
    }

    const meetingStartTime = zoomStartTime || onlineMeetingStartTime;
    const shouldCreateZoomMeeting = isTruthy(createZoomMeeting) || Boolean(meetingStartTime);

    let onlineMeeting = null;
    try {
      onlineMeeting = await buildOnlineMeeting({
        title: title.trim(),
        description: description ?? "",
        createMeeting: shouldCreateZoomMeeting,
        startTime: meetingStartTime,
      });
    } catch (zoomError) {
      return res.status(400).json({
        message: `Failed to create Zoom meeting: ${zoomError.message}`,
      });
    }

    const lesson = await Lesson.create({
      title: title.trim(),
      description: description ?? "",
      module: selectedModule._id,
      materialUrl: nextMaterialUrl,
      videoUrl: nextVideoUrl,
      onlineMeeting,
      createdBy: req.user._id,
      school: toNullableObjectId(req.user.school),
    });

    res.status(201).json({
      message: "Lesson created successfully",
      lesson,
      onlineMeeting: lesson.onlineMeeting || null,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A lesson with this title already exists in this module",
      });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllLessons = async (req, res) => {
  // List lessons with role-aware filtering and optional search
  // - Teachers: only lessons they created
  // - School admins: lessons belonging to their school
  // - Students: lessons for their grade (and optionally a specific module)
  // Also handles text search (`q`) and grade filtering.
  try {
    const query = {};
    const requestedModuleId =
      req.query.module && mongoose.Types.ObjectId.isValid(req.query.module)
        ? req.query.module
        : null;

    if (req.user.role === "teacher") {
      query.createdBy = req.user._id;
    } else if (req.user.role === "school_admin" && req.user.school) {
      query.school = req.user.school;
    } else if (req.user.role === "student") {
      if (!req.user.grade) {
        return res.status(200).json([]);
      }

      const moduleQuery = { grade: req.user.grade };
      if (requestedModuleId) {
        moduleQuery._id = requestedModuleId;
      }

      const modules = await Module.find(moduleQuery).select("_id");
      const moduleIds = modules.map((moduleItem) => moduleItem._id);

      if (moduleIds.length === 0) {
        return res.status(200).json([]);
      }

      query.module = { $in: moduleIds };
      const studentSchoolId = toNullableObjectId(req.user.school);
      query.$or = studentSchoolId
        ? [{ school: studentSchoolId }, { school: null }]
        : [{ school: null }];
    }

    if (requestedModuleId && req.user.role !== "student") {
      query.module = requestedModuleId;
    }

    const lessons = await Lesson.find(query)
      .populate({
        path: "module",
        select: "name description thumbnailUrl grade",
        populate: { path: "grade", select: "name" },
      })
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 });

    // Remove lessons whose referenced module no longer exists (orphaned)
    const orphanLessonIds = lessons
      .filter((lesson) => !lesson.module)
      .map((lesson) => lesson._id);

    if (orphanLessonIds.length > 0) {
      await Lesson.deleteMany({ _id: { $in: orphanLessonIds } });
    }

    const validLessons = lessons.filter((lesson) => Boolean(lesson.module));


    const { q, grade } = req.query || {};
    let filtered = validLessons;

    if (grade) {
      if (grade === "__unassigned") {
        filtered = filtered.filter((l) => !l.module.grade);
      } else {
        filtered = filtered.filter(
          (l) => l.module?.grade?._id?.toString() === String(grade),
        );
      }
    }

    if (q && String(q).trim()) {
      const re = new RegExp(escapeRegExp(String(q).trim()), "i");
      filtered = filtered.filter((l) => {
        if (re.test(l.title || "")) return true;
        if (l.module && re.test(l.module.name || "")) return true;
        if (l.module && l.module.grade && re.test(l.module.grade.name || "")) return true;
        return false;
      });
    }

    res.status(200).json(filtered);
  } catch (error) {
    console.error("getAllLessons error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLessonById = async (req, res) => {
  // Get a single lesson by id, ensuring the requester is authorized to view it
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate({
        path: "module",
        select: "name description thumbnailUrl grade",
        populate: { path: "grade", select: "name" },
      })
      .populate("createdBy", "firstName lastName role");

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (!lesson.module) {
      await Lesson.deleteOne({ _id: lesson._id });
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (!canViewLesson(req.user, lesson)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this lesson" });
    }

    res.status(200).json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLessonMaterialDownloadUrl = async (req, res) => {
  // Create a short-lived signed download URL for lesson material stored in Cloudinary
  try {
    const lesson = await Lesson.findById(req.params.id).populate("module", "grade");

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (!canViewLesson(req.user, lesson)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this lesson material" });
    }

    if (!lesson.materialUrl) {
      return res.status(404).json({ message: "Lesson material not found" });
    }

    const fileName = getCloudinaryFileNameFromUrl(lesson.materialUrl);
    const downloadUrl = createSignedDownloadUrlFromCloudinaryUrl(lesson.materialUrl, {
      expiresInSeconds: 300,
      fileName,
    });

    return res.status(200).json({ downloadUrl, fileName });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLessonVideoDownloadUrl = async (req, res) => {
  // Return a (public) video URL and the file name. Videos are typically served
  // directly; we still provide the filename for client download handling.
  try {
    const lesson = await Lesson.findById(req.params.id).populate("module", "grade");

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (!canViewLesson(req.user, lesson)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this lesson video" });
    }

    if (!lesson.videoUrl) {
      return res.status(404).json({ message: "Lesson video not found" });
    }

    const fileName = getCloudinaryFileNameFromUrl(lesson.videoUrl);
    const downloadUrl = lesson.videoUrl;

    return res.status(200).json({ downloadUrl, fileName });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateLesson = async (req, res) => {
  // Update an existing lesson
  // - Accepts new uploads for material/video and will replace previous assets
  // - Handles switching/creating/removing the online meeting based on toggles
  // - Cleans up replaced Cloudinary assets asynchronously
  try {
    const {
      title,
      description,
      module,
      materialUrl,
      videoUrl,
      createZoomMeeting,
      zoomStartTime,
      onlineMeetingStartTime,
    } = req.body;

    const materialFile = req.files?.material?.[0] || req.files?.materialUrl?.[0];
    const videoFile = req.files?.video?.[0] || req.files?.videoUrl?.[0];
    let uploadedMaterialUrl = "";
    let uploadedVideoUrl = "";

    if (materialFile) {
      const materialUpload = await uploadFileToCloudinary(materialFile, {
        folder: "learnbridge/lessons/materials",
        resourceType: "raw",
      });
      uploadedMaterialUrl = materialUpload.secure_url || "";
    }

    if (videoFile) {
      const videoUpload = await uploadFileToCloudinary(videoFile, {
        folder: "learnbridge/lessons/videos",
        resourceType: "video",
      });
      uploadedVideoUrl = videoUpload.secure_url || "";
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const previousMaterialUrl = lesson.materialUrl || "";
    const previousVideoUrl = lesson.videoUrl || "";

    if (!canManageLesson(req.user, lesson)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this lesson" });
    }

    if (module !== undefined) {
      const selectedModule = await Module.findById(module);

      if (!selectedModule) {
        return res.status(404).json({ message: "Module not found" });
      }

      lesson.module = selectedModule._id;
      lesson.school = toNullableObjectId(req.user.school);
    }

    if (title !== undefined) {
      lesson.title = title.trim();
    }
    if (description !== undefined) {
      lesson.description = description;
    }

    if (uploadedMaterialUrl) {
      lesson.materialUrl = uploadedMaterialUrl;
    } else if (materialUrl !== undefined) {
      lesson.materialUrl = materialUrl;
    }

    if (uploadedVideoUrl) {
      lesson.videoUrl = uploadedVideoUrl;
    } else if (videoUrl !== undefined) {
      lesson.videoUrl = videoUrl;
    }

    if (!ensureHasResource(lesson.materialUrl, lesson.videoUrl)) {
      return res.status(400).json({
        message: "Lesson must include at least one resource (document or video)",
      });
    }

    const meetingStartTime = zoomStartTime || onlineMeetingStartTime;
    const shouldCreateZoomMeeting = isTruthy(createZoomMeeting) || Boolean(meetingStartTime);
    const hasExplicitZoomToggle = createZoomMeeting !== undefined;

    if (hasExplicitZoomToggle || meetingStartTime !== undefined) {
      if (shouldCreateZoomMeeting) {
        try {
          lesson.onlineMeeting = await buildOnlineMeeting({
            title: lesson.title,
            description: lesson.description,
            createMeeting: true,
            startTime: meetingStartTime,
          });
        } catch (zoomError) {
          return res.status(400).json({
            message: `Failed to create Zoom meeting: ${zoomError.message}`,
          });
        }
      } else {
        lesson.onlineMeeting = null;
      }
    }

    await lesson.save();

    // Clean up replaced media assets in Cloudinary (best-effort)
    const cleanupTargets = [];
    if (previousMaterialUrl && previousMaterialUrl !== lesson.materialUrl) {
      cleanupTargets.push(previousMaterialUrl);
    }
    if (previousVideoUrl && previousVideoUrl !== lesson.videoUrl) {
      cleanupTargets.push(previousVideoUrl);
    }

    if (cleanupTargets.length > 0) {
      await Promise.allSettled(cleanupTargets.map((assetUrl) => deleteCloudinaryAssetFromUrl(assetUrl)));
    }

    res.status(200).json({ message: "Lesson updated successfully", lesson });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A lesson with this title already exists in this module",
      });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteLesson = async (req, res) => {
  // Delete a lesson if the requester has manage permissions. Clean up stored media.
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (!canManageLesson(req.user, lesson)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this lesson" });
    }

    const mediaToCleanup = [lesson.materialUrl, lesson.videoUrl].filter(Boolean);

    await Lesson.findByIdAndDelete(req.params.id);

    if (mediaToCleanup.length > 0) {
      await Promise.allSettled(
        mediaToCleanup.map((assetUrl) => deleteCloudinaryAssetFromUrl(assetUrl)),
      );
    }

    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
