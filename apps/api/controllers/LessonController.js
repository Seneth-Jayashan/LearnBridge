import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import { createZoomMeeting } from "../services/ZoomService.js";

const buildMediaUrl = (req, file) => {
  if (!file) return "";
  return `${req.protocol}://${req.get("host")}/uploads/lessons/${file.filename}`;
};

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
    const uploadedMaterialUrl = buildMediaUrl(req, materialFile);
    const uploadedVideoUrl = buildMediaUrl(req, videoFile);

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

    if (req.user.role === "teacher") {
      query.createdBy = req.user._id;
    } else if (req.user.role === "school_admin" && req.user.school) {
      query.school = req.user.school;
    }

    if (req.query.module && mongoose.Types.ObjectId.isValid(req.query.module)) {
      query.module = req.query.module;
    }

    const lessons = await Lesson.find(query)
      .populate("module", "name description thumbnailUrl")
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
      .populate("module", "name description thumbnailUrl")
      .populate("createdBy", "firstName lastName role");

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (!lesson.module) {
      await Lesson.deleteOne({ _id: lesson._id });
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (!canManageLesson(req.user, lesson)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this lesson" });
    }

    res.status(200).json(lesson);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    const uploadedMaterialUrl = buildMediaUrl(req, materialFile);
    const uploadedVideoUrl = buildMediaUrl(req, videoFile);

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

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

    await Lesson.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
