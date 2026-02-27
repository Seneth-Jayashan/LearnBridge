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

// Controller for assignment-related operations.
// Exports functions used by routes to create, update, delete and fetch
// assignments and their submissions. This file also handles uploading
// files to Cloudinary and generating signed download URLs.

// Convert a value to a nullable MongoDB ObjectId.
// - If the value is falsy (undefined/null/""), returns null.
// - If the value is a valid ObjectId string, returns the original value.
// - Otherwise returns null to avoid casting invalid ids in queries.
const toNullableObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

// Normalize various id-like values into a plain string id.
// Handles strings, Mongoose documents ({ _id }), or values with toString().
// Returns an empty string for falsy values.
const asIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value._id) return String(value._id);
    if (typeof value.toString === "function") return String(value.toString());
  }
  return String(value);
};

// Escape a string for use in a regular expression.
// Protects against special regex characters.
const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Authorization helper: determine whether `user` can manage (update/delete)
// the given `assignment`.
// Rules:
// - `super_admin` can manage everything.
// - `school_admin` can manage assignments that belong to their school.
// - `teacher` can manage assignments they created.
// - otherwise management is not allowed.
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

// Authorization helper: determine whether `user` can view the assignment.
// - If the user can manage the assignment (see `canManageAssignment`) they can view it.
// - Students can view assignments that belong to their grade.
// - All other roles are denied by default.
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

// Create a new assignment.
// Expected inputs (in `req`):
// - `req.body`: { title, description, module, materialUrl, dueDate }
// - file upload in `req.files.material` or `req.files.materialUrl` (handled by middleware)
// - `req.user`: authenticated user creating the assignment
// Behavior:
// - Validates the module exists, uploads material file to Cloudinary (if provided),
//   and creates an Assignment document with the provided data.
// - Returns 201 and the created assignment on success.
export const createAssignment = async (req, res) => {
  try {
    const { title, description, module, materialUrl, dueDate } = req.body;
    // Prefer uploaded file (multipart) over a provided URL field.
    const materialFile = req.files?.material?.[0] || req.files?.materialUrl?.[0];

    // Ensure the target module exists before creating assignment.
    const selectedModule = await Module.findById(module);
    if (!selectedModule) {
      return res.status(404).json({ message: "Module not found" });
    }

    // If an actual file is uploaded, store it in Cloudinary.
    let uploadedMaterialUrl = "";
    if (materialFile) {
      const materialUpload = await uploadFileToCloudinary(materialFile, {
        folder: "learnbridge/assignments/materials",
        resourceType: "raw",
      });
      uploadedMaterialUrl = materialUpload.secure_url || "";
    }

    // Create the assignment document. Trim title and fall back to empty strings
    // where fields may be undefined.
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
    // Validation and casting errors indicate bad client input.
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    // Anything else is treated as a server error.
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all assignments accessible to the requesting user.
// Behavior varies by role:
// - `teacher`: returns assignments created by that teacher.
// - `school_admin`: returns assignments for their school.
// - `student`: returns assignments for their grade (and optionally a specific module),
//   and includes that student's submission (if any) on each assignment.
// Supports optional `req.query.module` to filter by module and `req.query.q` to search.
export const getAllAssignments = async (req, res) => {
  try {
    const query = {};
    // If a module id was provided and is a valid ObjectId, keep it.
    const requestedModuleId =
      req.query.module && mongoose.Types.ObjectId.isValid(req.query.module)
        ? req.query.module
        : null;

    // Build base query depending on role.
    if (req.user.role === "teacher") {
      // Teachers only see assignments they created.
      query.createdBy = req.user._id;
    } else if (req.user.role === "school_admin" && req.user.school) {
      // School admins see assignments for their school.
      query.school = req.user.school;
    } else if (req.user.role === "student") {
      // Students see assignments for their grade (and optionally limited to a module).
      if (!req.user.grade) {
        // If student has no grade assigned, return an empty list.
        return res.status(200).json([]);
      }

      const moduleQuery = { grade: req.user.grade };
      if (requestedModuleId) {
        moduleQuery._id = requestedModuleId;
      }

      // Find modules matching the student's grade (and module filter if present).
      const modules = await Module.find(moduleQuery).select("_id");
      const moduleIds = modules.map((moduleItem) => moduleItem._id);

      if (moduleIds.length === 0) {
        return res.status(200).json([]);
      }

      // Only include assignments that belong to one of the student's modules.
      query.module = { $in: moduleIds };
      // Students may see assignments that are global (school=null) or specific to their school.
      const studentSchoolId = toNullableObjectId(req.user.school);
      query.$or = studentSchoolId
        ? [{ school: studentSchoolId }, { school: null }]
        : [{ school: null }];
    }

    // For non-students, if a module query param is given, filter by it.
    if (requestedModuleId && req.user.role !== "student") {
      query.module = requestedModuleId;
    }

    // Fetch assignments and populate module and creator info for display.
    const assignments = await Assignment.find(query)
      .populate({
        path: "module",
        select: "name description thumbnailUrl grade",
        populate: { path: "grade", select: "name" },
      })
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: -1 });

    // Detect any orphaned assignments (module was removed) and delete them
    // along with associated submissions to keep data consistent.
    const orphanAssignmentIds = assignments
      .filter((assignment) => !assignment.module)
      .map((assignment) => assignment._id);

    if (orphanAssignmentIds.length > 0) {
      await AssignmentSubmission.deleteMany({ assignment: { $in: orphanAssignmentIds } });
      await Assignment.deleteMany({ _id: { $in: orphanAssignmentIds } });
    }

    // Only keep assignments that still have a module (filter out orphans in memory).
    let validAssignments = assignments.filter((assignment) => Boolean(assignment.module));

    // Apply optional text search over assignment title, module name, and grade name.
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

    // If the requester is a student, attach their submission (if any) to each assignment.
    if (req.user.role === "student") {
      const assignmentIds = validAssignments.map((assignment) => assignment._id);
      const submissions = await AssignmentSubmission.find({
        assignment: { $in: assignmentIds },
        student: req.user._id,
      }).sort({ submittedAt: -1 });

      // Map submissions by assignment id for quick lookup.
      const submissionMap = submissions.reduce((acc, item) => {
        acc[item.assignment.toString()] = item;
        return acc;
      }, {});

      // Merge student's submission into the assignment payload.
      const payload = validAssignments.map((assignment) => {
        const assignmentJson = assignment.toObject();
        assignmentJson.studentSubmission =
          submissionMap[assignment._id.toString()]?.toObject() || null;
        return assignmentJson;
      });

      return res.status(200).json(payload);
    }

    // Non-students receive the assignment documents directly.
    return res.status(200).json(validAssignments);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single assignment by id. Performs authorization via `canViewAssignment`.
// If the assignment's module is missing (orphaned), the assignment and its
// submissions are removed and a 404 returned to the client.
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

    // If the module was deleted externally, treat the assignment as not found
    // and clean up related submissions.
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

// Generate a short-lived signed download URL for an assignment's material.
// Only users who can view the assignment may request the material.
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

    // Use Cloudinary helpers to derive the file name and signed URL.
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

// Submit or update a student's submission for an assignment.
// - Validates that the assignment exists and the user can view it.
// - Requires a file upload in `req.files.submission` or `req.files.submissionUrl`.
// - If the student previously uploaded a file, attempt to delete the old Cloudinary asset.
// - Upserts the `AssignmentSubmission` document with the new file URL and notes.
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

    // Accept file uploads from either a multipart upload (`submission`) or
    // a field named `submissionUrl` (middleware may normalize this).
    const submissionFile = req.files?.submission?.[0] || req.files?.submissionUrl?.[0];
    if (!submissionFile) {
      return res.status(400).json({ message: "Please upload your assignment work file" });
    }

    // Upload the new submission file to Cloudinary.
    const uploadedSubmission = await uploadFileToCloudinary(submissionFile, {
      folder: "learnbridge/assignments/submissions",
      resourceType: "raw",
    });

    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
    const submissionUrl = uploadedSubmission.secure_url || "";

    if (!submissionUrl) {
      return res.status(400).json({ message: "Failed to upload assignment submission" });
    }

    // If a previous submission exists, try to remove the old file from Cloudinary.
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    if (existingSubmission?.fileUrl) {
      try {
        await deleteCloudinaryAssetFromUrl(existingSubmission.fileUrl);
      } catch {
        // Ignore deletion errors; they shouldn't block the new submission.
      }
    }

    // Upsert the submission (create or update) with the new file and notes.
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

// Update an existing assignment. Only users who can manage the assignment
// (see `canManageAssignment`) are allowed to update it.
// Fields in `req.body` that are `undefined` are left unchanged; provide an
// explicit `null`/value to change them.
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

    // If module is provided, validate it and update the assignment's module.
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

    // If a new material file is uploaded, replace the materialUrl with the
    // uploaded file; otherwise if materialUrl is explicitly provided, use it.
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

    // If the material URL changed, attempt to delete the previous Cloudinary asset.
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

// Delete an assignment and its submissions. Only users who can manage the
// assignment are allowed to delete it. On deletion, attempt to remove any
// associated uploaded files from Cloudinary (submissions + material).
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

    // Gather submission file URLs so we can delete remote assets later.
    const submissions = await AssignmentSubmission.find({ assignment: assignment._id }).select(
      "fileUrl",
    );
    const submissionFileUrls = submissions
      .map((submission) => submission.fileUrl)
      .filter((fileUrl) => Boolean(fileUrl));

    // Remove submission documents and the assignment document locally.
    await AssignmentSubmission.deleteMany({ assignment: assignment._id });
    await Assignment.findByIdAndDelete(assignment._id);

    // Construct Cloudinary deletion tasks for all files we should remove.
    const cloudinaryDeletionTasks = [
      ...submissionFileUrls.map((fileUrl) => deleteCloudinaryAssetFromUrl(fileUrl)),
      ...(materialUrl ? [deleteCloudinaryAssetFromUrl(materialUrl)] : []),
    ];

    if (cloudinaryDeletionTasks.length > 0) {
      // Run deletions in parallel but don't fail the request if deletions error.
      await Promise.allSettled(cloudinaryDeletionTasks);
    }

    return res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Return the current authenticated student's submission (if any) for the
// specified assignment. Authorization is handled by `canViewAssignment`.
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

// Generate a signed download URL for a specific submission file.
// Only users who can manage the parent assignment (teachers, admins) may request this.
export const getAssignmentSubmissionDownloadUrl = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("module", "grade");
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!canManageAssignment(req.user, assignment)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to download this submission" });
    }

    const submissionId = req.params.submissionId;
    if (!submissionId) {
      return res.status(400).json({ message: "Submission id is required" });
    }

    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission || String(submission.assignment) !== String(assignment._id)) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (!submission.fileUrl) {
      return res.status(404).json({ message: "Submission file not found" });
    }

    const fileName = getCloudinaryFileNameFromUrl(submission.fileUrl);
    const downloadUrl = createSignedDownloadUrlFromCloudinaryUrl(submission.fileUrl, {
      expiresInSeconds: 300,
      fileName,
    });

    return res.status(200).json({ downloadUrl, fileName });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// List all submissions for an assignment. Only users who can manage the
// assignment may request the list. Each submission includes the student's
// basic info for display purposes.
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
