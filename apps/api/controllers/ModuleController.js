import Module from "../models/Module.js";
import Grade from "../models/Grade.js";
import Level from "../models/Level.js";
import Lesson from "../models/Lesson.js";
import mongoose from "mongoose";
import { uploadFileToCloudinary, deleteCloudinaryAssetFromUrl } from "../services/CloudinaryService.js";

const STREAMS = [
    "Mathematics Stream",
    "Biology Stream",
    "Commerce Stream",
    "Arts Stream",
    "Technology Stream",
];

const getNormalizedStream = (value) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
};

const parseGradeNumber = (gradeName) => {
    const parsed = Number.parseInt(String(gradeName || "").trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
};

// --- Create a New Module ---
export const createModule = async (req, res) => {
    try {
        const { name, description, thumbnailUrl, level, grade, subjectStream } = req.body;
        const thumbnailFile = req.files?.thumbnail?.[0] || req.files?.thumbnailUrl?.[0];

        if (!name?.trim()) {
            return res.status(400).json({ message: "Module name is required." });
        }

        if (!level) {
            return res.status(400).json({ message: "Level is required." });
        }

        if (!grade) {
            return res.status(400).json({ message: "Grade is required." });
        }

        const levelRecord = await Level.findById(level);
        if (!levelRecord) {
            return res.status(400).json({ message: "Selected level is invalid." });
        }

        const gradeRecord = await Grade.findById(grade);
        if (!gradeRecord) {
            return res.status(400).json({ message: "Selected grade is invalid." });
        }

        const gradeNumber = parseGradeNumber(gradeRecord.name);
        const normalizedSubjectStream = getNormalizedStream(subjectStream);

        if (gradeNumber !== null && gradeNumber >= 12) {
            if (!normalizedSubjectStream || !STREAMS.includes(normalizedSubjectStream)) {
                return res.status(400).json({ message: "Subject stream is required for grades 12 and 13." });
            }
        }

        if (gradeNumber !== null && gradeNumber < 12 && normalizedSubjectStream) {
            return res.status(400).json({ message: "Subject stream can only be selected for grades 12 and 13." });
        }

        const normalizedName = name.trim();
        const providedThumbnailUrl = typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : "";

        let finalThumbnailUrl = providedThumbnailUrl;
        if (thumbnailFile) {
            const thumbnailUpload = await uploadFileToCloudinary(thumbnailFile, {
                folder: "learnbridge/modules/thumbnails",
                resourceType: "image",
            });
            finalThumbnailUrl = thumbnailUpload.secure_url || "";
        }

        const existingModule = await Module.findOne({
            name: normalizedName,
            level,
            grade,
            subjectStream: normalizedSubjectStream,
        });
        if (existingModule) {
            return res.status(400).json({ message: "Module with this name already exists for selected level/grade/stream." });
        }

        const newModule = new Module({
            name: normalizedName,
            description,
            thumbnailUrl: finalThumbnailUrl,
            level,
            grade,
            subjectStream: normalizedSubjectStream,
        });

        await newModule.save();

        res.status(201).json({ 
            message: "Module created successfully", 
            module: newModule 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Get All Modules ---
export const getAllModules = async (req, res) => {
    try {
        const modules = await Module.find()
            .populate("level", "name description")
            .populate("grade", "name description")
            .sort({ createdAt: -1 });
        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Get Single Module by ID ---
export const getModuleById = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id)
            .populate("level", "name description")
            .populate("grade", "name description");
        
        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        res.status(200).json(module);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Update Module ---
export const updateModule = async (req, res) => {
    try {
        const { name, description, thumbnailUrl, level, grade, subjectStream } = req.body;
        const thumbnailFile = req.files?.thumbnail?.[0] || req.files?.thumbnailUrl?.[0];
        
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        const nextLevel = level || module.level;
        const nextGrade = grade || module.grade;

        if (!nextLevel) {
            return res.status(400).json({ message: "Level is required." });
        }

        if (!nextGrade) {
            return res.status(400).json({ message: "Grade is required." });
        }

        const levelRecord = await Level.findById(nextLevel);
        if (!levelRecord) {
            return res.status(400).json({ message: "Selected level is invalid." });
        }

        const gradeRecord = await Grade.findById(nextGrade);
        if (!gradeRecord) {
            return res.status(400).json({ message: "Selected grade is invalid." });
        }

        const gradeNumber = parseGradeNumber(gradeRecord.name);
        const normalizedSubjectStream = getNormalizedStream(subjectStream !== undefined ? subjectStream : module.subjectStream);

        if (gradeNumber !== null && gradeNumber >= 12) {
            if (!normalizedSubjectStream || !STREAMS.includes(normalizedSubjectStream)) {
                return res.status(400).json({ message: "Subject stream is required for grades 12 and 13." });
            }
        }

        if (gradeNumber !== null && gradeNumber < 12 && normalizedSubjectStream) {
            return res.status(400).json({ message: "Subject stream can only be selected for grades 12 and 13." });
        }

        const normalizedName = name?.trim() || module.name;

        const duplicate = await Module.findOne({
            _id: { $ne: module._id },
            name: normalizedName,
            level: nextLevel,
            grade: nextGrade,
            subjectStream: normalizedSubjectStream,
        });

        if (duplicate) {
            return res.status(400).json({ message: "Module with this name already exists for selected level/grade/stream." });
        }

        module.name = normalizedName;
        if (description !== undefined) module.description = description;
        if (thumbnailFile) {
            const thumbnailUpload = await uploadFileToCloudinary(thumbnailFile, {
                folder: "learnbridge/modules/thumbnails",
                resourceType: "image",
            });
            module.thumbnailUrl = thumbnailUpload.secure_url || "";
        } else if (thumbnailUrl !== undefined) {
            module.thumbnailUrl = typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : thumbnailUrl;
        }
        module.level = nextLevel;
        module.grade = nextGrade;
        module.subjectStream = normalizedSubjectStream;

        await module.save();

        res.status(200).json({ 
            message: "Module updated successfully", 
            module 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Delete Module ---
export const deleteModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        
        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        const moduleObjectId = mongoose.Types.ObjectId.isValid(req.params.id)
            ? new mongoose.Types.ObjectId(req.params.id)
            : null;

        // Attempt to remove module thumbnail from Cloudinary (ignore errors)
        try {
            if (module?.thumbnailUrl) {
                if (Array.isArray(module.thumbnailUrl)) {
                    for (const url of module.thumbnailUrl) {
                        try { await deleteCloudinaryAssetFromUrl(url); } catch (e) { /* ignore */ }
                    }
                } else {
                    try { await deleteCloudinaryAssetFromUrl(module.thumbnailUrl); } catch (e) { /* ignore */ }
                }
            }
        } catch (err) {
            // Swallow thumbnail deletion errors so module deletion can proceed
        }

        const lessonDeleteFilter = {
            $or: [
                { module: req.params.id },
                { moduleId: req.params.id },
                ...(moduleObjectId ? [{ module: moduleObjectId }, { moduleId: moduleObjectId }] : []),
            ],
        };

        const lessonDeleteResult = await Lesson.deleteMany(lessonDeleteFilter);
        await Module.deleteOne({ _id: req.params.id });

        res.status(200).json({
            message: "Module deleted successfully",
            deletedLessons: lessonDeleteResult.deletedCount || 0,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};