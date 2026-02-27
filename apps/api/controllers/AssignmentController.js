import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Module from "../models/Module.js";
import {
  createSignedDownloadUrlFromCloudinaryUrl,
  deleteCloudinaryAssetFromUrl,
  getCloudinaryFileNameFromUrl,
  uploadFileToCloudinary,
} from "../services/CloudinaryService.js";

const toNullableObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

const asIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value._id) return String(value._id);
    if (typeof value.toString === "function") return String(value.toString());
  }
  return String(value);
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canManageAssignment = (user, assignment) => {
  if (user.role === "super_admin") return true;

  if (user.role === "school_admin") {
    return (
      Boolean(user.school) &&
      Boolean(assignment.school) &&
      asIdString(user.school) === asIdString(assignment.school)
    );
  }

  if (user.role === "teacher") {
    return asIdString(assignment.createdBy) === asIdString(user._id);
  }

  return false;
};

const canViewAssignment = (user, assignment) => {
  if (canManageAssignment(user, assignment)) return true;

  if (user.role === "student") {
    return (
      Boolean(user.grade) &&
      Boolean(assignment?.module?.grade) &&
      user.grade.toString() === assignment.module.grade.toString()
    );
  }

  return false;
};

export const createAssignment = async (req, res) => {
  try {
    const { title, description, module, materialUrl, dueDate } = req.body;
    const materialFile = req.files?.material?.[0] || req.files?.materialUrl?.[0];

    const selectedModule = await Module.findById(module);
    if (!selectedModule) {
      return res.status(404).json({ message: "Module not found" });
    }

    let uploadedMaterialUrl = "";
    if (materialFile) {
      const materialUpload = await uploadFileToCloudinary(materialFile, {
        folder: "learnbridge/assignments/materials",
        resourceType: "raw",
      });
      uploadedMaterialUrl = materialUpload.secure_url || "";
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description ?? "",
      module: selectedModule._id,
      materialUrl: uploadedMaterialUrl || materialUrl || "",
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.user._id,
      school: toNullableObjectId(req.user.school),
    });

    return res.status(201).json({
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllAssignments = async (req, res) => {
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

    const assignments = await Assignment.find(query)
      .populate({
        path: "module",
        select: "name description thumbnailUrl grade",
        populate: { path: "grade", select: "name" },
      })
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 });

    const orphanAssignmentIds = assignments
      .filter((assignment) => !assignment.module)
      .map((assignment) => assignment._id);

    if (orphanAssignmentIds.length > 0) {
      await AssignmentSubmission.deleteMany({ assignment: { $in: orphanAssignmentIds } });
      await Assignment.deleteMany({ _id: { $in: orphanAssignmentIds } });
    }

    let validAssignments = assignments.filter((assignment) => Boolean(assignment.module));

    const { q } = req.query || {};
    if (q && String(q).trim()) {
      const re = new RegExp(escapeRegExp(String(q).trim()), "i");
      validAssignments = validAssignments.filter((assignment) => {
        if (re.test(assignment.title || "")) return true;
        if (assignment.module && re.test(assignment.module.name || "")) return true;
        if (
          assignment.module &&
          assignment.module.grade &&
          re.test(assignment.module.grade.name || "")
        ) {
          return true;
        }
        return false;
      });
    }

    if (req.user.role === "student") {
      const assignmentIds = validAssignments.map((assignment) => assignment._id);
      const submissions = await AssignmentSubmission.find({
        assignment: { $in: assignmentIds },
        student: req.user._id,
      }).sort({ submittedAt: -1 });

      const submissionMap = submissions.reduce((acc, item) => {
        acc[item.assignment.toString()] = item;
        return acc;
      }, {});

      const payload = validAssignments.map((assignment) => {
        const assignmentJson = assignment.toObject();
        assignmentJson.studentSubmission =
          submissionMap[assignment._id.toString()]?.toObject() || null;
        return assignmentJson;
      });

      return res.status(200).json(payload);
    }

    return res.status(200).json(validAssignments);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate({
        path: "module",
        select: "name description thumbnailUrl grade",
        populate: { path: "grade", select: "name" },
      })
      .populate("createdBy", "firstName lastName role");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!assignment.module) {
      await AssignmentSubmission.deleteMany({ assignment: assignment._id });
      await Assignment.deleteOne({ _id: assignment._id });
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!canViewAssignment(req.user, assignment)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this assignment" });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAssignmentMaterialDownloadUrl = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("module", "grade");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!canViewAssignment(req.user, assignment)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this assignment material" });
    }

    if (!assignment.materialUrl) {
      return res.status(404).json({ message: "Assignment material not found" });
    }

    const fileName = getCloudinaryFileNameFromUrl(assignment.materialUrl);
    const downloadUrl = createSignedDownloadUrlFromCloudinaryUrl(assignment.materialUrl, {
      expiresInSeconds: 300,
      fileName,
    });

    return res.status(200).json({ downloadUrl, fileName });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("module", "grade");
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!canViewAssignment(req.user, assignment)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to submit this assignment" });
    }

    const submissionFile = req.files?.submission?.[0] || req.files?.submissionUrl?.[0];
    if (!submissionFile) {
      return res.status(400).json({ message: "Please upload your assignment work file" });
    }

    const uploadedSubmission = await uploadFileToCloudinary(submissionFile, {
      folder: "learnbridge/assignments/submissions",
      resourceType: "raw",
    });

    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
    const submissionUrl = uploadedSubmission.secure_url || "";

    if (!submissionUrl) {
      return res.status(400).json({ message: "Failed to upload assignment submission" });
    }

    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    if (existingSubmission?.fileUrl) {
      try {
        await deleteCloudinaryAssetFromUrl(existingSubmission.fileUrl);
      } catch {
        // Ignore deletion errors while replacing a submission.
      }
    }

    const savedSubmission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user._id },
      {
        assignment: assignment._id,
        student: req.user._id,
        fileUrl: submissionUrl,
        notes,
        submittedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      message: "Assignment submitted successfully",
      submission: savedSubmission,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { title, description, module, materialUrl, dueDate } = req.body;
    const materialFile = req.files?.material?.[0] || req.files?.materialUrl?.[0];

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!canManageAssignment(req.user, assignment)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this assignment" });
    }

    const previousMaterialUrl = assignment.materialUrl || "";

    if (module !== undefined) {
      const selectedModule = await Module.findById(module);
      if (!selectedModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      assignment.module = selectedModule._id;
      assignment.school = toNullableObjectId(req.user.school);
    }

    if (title !== undefined) {
      assignment.title = title.trim();
    }

    if (description !== undefined) {
      assignment.description = description;
    }

    if (dueDate !== undefined) {
      assignment.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (materialFile) {
      const materialUpload = await uploadFileToCloudinary(materialFile, {
        folder: "learnbridge/assignments/materials",
        resourceType: "raw",
      });
      assignment.materialUrl = materialUpload.secure_url || "";
    } else if (materialUrl !== undefined) {
      assignment.materialUrl = materialUrl;
    }

    await assignment.save();

    if (previousMaterialUrl && previousMaterialUrl !== assignment.materialUrl) {
      await Promise.allSettled([deleteCloudinaryAssetFromUrl(previousMaterialUrl)]);
    }

    return res.status(200).json({
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!canManageAssignment(req.user, assignment)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this assignment" });
    }

    const materialUrl = assignment.materialUrl || "";

    await AssignmentSubmission.deleteMany({ assignment: assignment._id });
    await Assignment.findByIdAndDelete(assignment._id);

    if (materialUrl) {
      await Promise.allSettled([deleteCloudinaryAssetFromUrl(materialUrl)]);
    }

    return res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMyAssignmentSubmission = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("module", "grade");
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!canViewAssignment(req.user, assignment)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this assignment" });
    }

    const submission = await AssignmentSubmission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    return res.status(200).json({ submission });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("module", "grade");
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!canManageAssignment(req.user, assignment)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view assignment submissions" });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
      .populate("student", "firstName lastName regNumber")
      .sort({ submittedAt: -1 });

    return res.status(200).json(submissions);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
