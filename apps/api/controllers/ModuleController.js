import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import mongoose from "mongoose";
import { uploadFileToCloudinary, deleteCloudinaryAssetFromUrl } from "../services/CloudinaryService.js";
import {
    ModuleValidationError,
    validateCreateModuleBusinessRules,
    validateUpdateModuleBusinessRules,
} from "../validators/ModuleValidator.js";

// --- Create a New Module ---
export const createModule = async (req, res) => {
    try {
        const { name, description, thumbnailUrl, level, grade, subjectStream } = req.body;
        const thumbnailFile = req.files?.thumbnail?.[0] || req.files?.thumbnailUrl?.[0];

        const {
            normalizedName,
            normalizedSubjectStream,
            nextLevel,
            nextGrade,
        } = await validateCreateModuleBusinessRules({
            name,
            level,
            grade,
            subjectStream,
        });

        const providedThumbnailUrl = typeof thumbnailUrl === "string" ? thumbnailUrl.trim() : "";

        let finalThumbnailUrl = providedThumbnailUrl;
        if (thumbnailFile) {
            const thumbnailUpload = await uploadFileToCloudinary(thumbnailFile, {
                folder: "learnbridge/modules/thumbnails",
                resourceType: "image",
            });
            finalThumbnailUrl = thumbnailUpload.secure_url || "";
        }

        const newModule = new Module({
            name: normalizedName,
            description,
            thumbnailUrl: finalThumbnailUrl,
            level: nextLevel,
            grade: nextGrade,
            subjectStream: normalizedSubjectStream,
        });

        await newModule.save();

        res.status(201).json({ 
            message: "Module created successfully", 
            module: newModule 
        });

    } catch (error) {
        if (error instanceof ModuleValidationError) {
            return res.status(400).json({ message: error.message });
        }
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

        const {
            normalizedName,
            normalizedSubjectStream,
            nextLevel,
            nextGrade,
        } = await validateUpdateModuleBusinessRules({
            moduleId: module._id,
            currentName: module.name,
            currentLevel: module.level,
            currentGrade: module.grade,
            currentSubjectStream: module.subjectStream,
            name,
            level,
            grade,
            subjectStream,
        });

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
        if (error instanceof ModuleValidationError) {
            return res.status(400).json({ message: error.message });
        }
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