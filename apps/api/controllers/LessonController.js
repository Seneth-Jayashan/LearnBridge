import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import Course from "../models/Course.js";

const buildMediaUrl = (req, file) => {
  if (!file) return "";
  return `${req.protocol}://${req.get("host")}/uploads/lessons/${file.filename}`;
};

const canManageCourse = (user, course) => {
  if (user.role === "super_admin") return true;

  if (user.role === "school_admin") {
    return (
      user.school &&
      course.school &&
      user.school.toString() === course.school.toString()
    );
  }

  if (user.role === "teacher") {
    return course.createdBy.toString() === user._id.toString();
  }

  return false;
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

export const createLesson = async (req, res) => {
  try {
    const { title, description, course, materialUrl, videoUrl } = req.body;

    const materialFile = req.files?.material?.[0] || req.files?.materialUrl?.[0];
    const videoFile = req.files?.video?.[0] || req.files?.videoUrl?.[0];
    const uploadedMaterialUrl = buildMediaUrl(req, materialFile);
    const uploadedVideoUrl = buildMediaUrl(req, videoFile);

    const selectedCourse = await Course.findById(course);

    if (!selectedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!canManageCourse(req.user, selectedCourse)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to add lessons to this course" });
    }

    const nextMaterialUrl = uploadedMaterialUrl || materialUrl || "";
    const nextVideoUrl = uploadedVideoUrl || videoUrl || "";

    if (!ensureHasResource(nextMaterialUrl, nextVideoUrl)) {
      return res.status(400).json({
        message: "Please upload at least one lesson resource (document or video)",
      });
    }

    const lesson = await Lesson.create({
      title: title.trim(),
      description: description ?? "",
      course: selectedCourse._id,
      materialUrl: nextMaterialUrl,
      videoUrl: nextVideoUrl,
      createdBy: req.user._id,
      school: toNullableObjectId(selectedCourse.school || req.user.school),
    });

    res.status(201).json({ message: "Lesson created successfully", lesson });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A lesson with this title already exists in this course",
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

    if (req.query.course && mongoose.Types.ObjectId.isValid(req.query.course)) {
      query.course = req.query.course;
    }

    const lessons = await Lesson.find(query)
      .populate("course", "name subject grade stream")
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 });

    res.status(200).json(lessons);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate("course", "name subject grade stream")
      .populate("createdBy", "firstName lastName role");

    if (!lesson) {
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
    const { title, description, course, materialUrl, videoUrl } = req.body;

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

    if (course !== undefined) {
      const selectedCourse = await Course.findById(course);

      if (!selectedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (!canManageCourse(req.user, selectedCourse)) {
        return res.status(403).json({
          message: "You do not have permission to move this lesson to that course",
        });
      }

      lesson.course = selectedCourse._id;
      lesson.school = toNullableObjectId(selectedCourse.school || req.user.school);
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

    await lesson.save();

    res.status(200).json({ message: "Lesson updated successfully", lesson });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A lesson with this title already exists in this course",
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
