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

const toNullableObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

const ensureHasResource = (materialUrl, videoUrl) => Boolean(materialUrl || videoUrl);
const isTruthy = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
};

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

export const createLesson = async (req, res) => {
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

    const orphanLessonIds = lessons
      .filter((lesson) => !lesson.module)
      .map((lesson) => lesson._id);

    if (orphanLessonIds.length > 0) {
      await Lesson.deleteMany({ _id: { $in: orphanLessonIds } });
    }

    const validLessons = lessons.filter((lesson) => Boolean(lesson.module));

    res.status(200).json(validLessons);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLessonById = async (req, res) => {
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

export const updateLesson = async (req, res) => {
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
