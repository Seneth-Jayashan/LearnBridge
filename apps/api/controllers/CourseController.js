import Course from "../models/Course.js";
import mongoose from "mongoose";

const requiresStream = (grade) => grade === "Grade 12" || grade === "Grade 13";

const buildMediaUrl = (req, file) => {
  if (!file) return "";
  return `${req.protocol}://${req.get("host")}/uploads/courses/${file.filename}`;
};

const getInstructorFromUser = (user) => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name;
};

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const toNullableObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
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

export const createCourse = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      fullDescription,
      language,
      subject,
      grade,
      stream,
      thumbnailUrl,
      introVideoUrl,
      durationHours,
      numberOfLessons,
      instructor,
    } = req.body;

    const thumbnailFile = req.files?.thumbnail?.[0] || req.files?.thumbnailUrl?.[0];
    const introVideoFile = req.files?.introVideo?.[0] || req.files?.introVideoUrl?.[0];
    const uploadedThumbnailUrl = buildMediaUrl(req, thumbnailFile);
    const uploadedIntroVideoUrl = buildMediaUrl(req, introVideoFile);
    const instructorFromUser = getInstructorFromUser(req.user);
    const normalizedName = normalizeString(name);

    if (requiresStream(grade) && !stream) {
      return res
        .status(400)
        .json({ message: "Stream is required for Grade 12 and Grade 13" });
    }

    const existingCourse = await Course.findOne({
      name: normalizedName,
      createdBy: req.user._id,
    });

    if (existingCourse) {
      return res
        .status(400)
        .json({ message: "You already have a course with this name" });
    }

    const course = await Course.create({
      name: normalizedName,
      description: description ?? fullDescription ?? "",
      shortDescription: shortDescription ?? "",
      fullDescription: fullDescription ?? "",
      language: language ?? "",
      subject: subject ?? "",
      grade: grade ?? "",
      stream: requiresStream(grade) ? stream ?? "" : "",
      thumbnailUrl: uploadedThumbnailUrl || thumbnailUrl || "",
      introVideoUrl: uploadedIntroVideoUrl || introVideoUrl || "",
      durationHours: durationHours ?? 0,
      numberOfLessons: numberOfLessons ?? 0,
      instructor: instructorFromUser || instructor || "",
      createdBy: req.user._id,
      school: toNullableObjectId(req.user.school),
    });

    res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You already have a course with this name" });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "teacher") {
      query.createdBy = req.user._id;
    } else if (req.user.role === "school_admin" && req.user.school) {
      query.school = req.user.school;
    }

    const courses = await Course.find(query)
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName role",
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!canManageCourse(req.user, course)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this course" });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      fullDescription,
      language,
      subject,
      grade,
      stream,
      thumbnailUrl,
      introVideoUrl,
      durationHours,
      numberOfLessons,
      instructor,
    } = req.body;

    const thumbnailFile = req.files?.thumbnail?.[0] || req.files?.thumbnailUrl?.[0];
    const introVideoFile = req.files?.introVideo?.[0] || req.files?.introVideoUrl?.[0];
    const uploadedThumbnailUrl = buildMediaUrl(req, thumbnailFile);
    const uploadedIntroVideoUrl = buildMediaUrl(req, introVideoFile);
    const instructorFromUser = getInstructorFromUser(req.user);

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!canManageCourse(req.user, course)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this course" });
    }

    if (name && name.trim() !== course.name) {
      const existingCourse = await Course.findOne({
        name: name.trim(),
        createdBy: course.createdBy,
      });

      if (existingCourse && existingCourse._id.toString() !== req.params.id) {
        return res
          .status(400)
          .json({ message: "Course with this name already exists" });
      }

      course.name = name.trim();
    }

    if (description !== undefined) {
      course.description = description;
    }
    if (shortDescription !== undefined) {
      course.shortDescription = shortDescription;
    }
    if (fullDescription !== undefined) {
      course.fullDescription = fullDescription;
      if (description === undefined) {
        course.description = fullDescription;
      }
    }
    if (language !== undefined) {
      course.language = language;
    }
    if (subject !== undefined) {
      course.subject = subject;
    }
    if (grade !== undefined) {
      course.grade = grade;
    }
    if (stream !== undefined) {
      course.stream = stream;
    }
    if (uploadedThumbnailUrl) {
      course.thumbnailUrl = uploadedThumbnailUrl;
    } else if (thumbnailUrl !== undefined) {
      course.thumbnailUrl = thumbnailUrl;
    }
    if (uploadedIntroVideoUrl) {
      course.introVideoUrl = uploadedIntroVideoUrl;
    } else if (introVideoUrl !== undefined) {
      course.introVideoUrl = introVideoUrl;
    }
    if (durationHours !== undefined) {
      course.durationHours = durationHours;
    }
    if (numberOfLessons !== undefined) {
      course.numberOfLessons = numberOfLessons;
    }
    if (instructorFromUser) {
      course.instructor = instructorFromUser;
    } else if (instructor !== undefined) {
      course.instructor = instructor;
    }

    if (requiresStream(course.grade) && !course.stream) {
      return res
        .status(400)
        .json({ message: "Stream is required for Grade 12 and Grade 13" });
    }

    if (!requiresStream(course.grade)) {
      course.stream = "";
    }

    await course.save();

    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Course with this name already exists" });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!canManageCourse(req.user, course)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this course" });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};