import { z } from "zod";
import mongoose from "mongoose";
import Module from "../models/Module.js";
import Grade from "../models/Grade.js";
import Level from "../models/Level.js";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const STREAMS = [
  "Mathematics Stream",
  "Biology Stream",
  "Commerce Stream",
  "Arts Stream",
  "Technology Stream",
];

const parseGradeNumber = (gradeName) => {
  const parsed = Number.parseInt(String(gradeName || "").trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export class ModuleValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ModuleValidationError";
  }
}

const optionalSubjectStream = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  },
  z
    .enum([
      "Mathematics Stream",
      "Biology Stream",
      "Commerce Stream",
      "Arts Stream",
      "Technology Stream",
    ])
    .nullable()
    .optional(),
);

const optionalThumbnailUrl = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : "";
  },
  z.string().optional(),
);

export const createModuleSchema = z.object({
  name: z.string().min(1, "Module name is required").trim(),
  description: z.string().optional(),
  thumbnailUrl: optionalThumbnailUrl,
  level: z
    .string()
    .min(1, "Level is required")
    .refine(isObjectId, "Level id is invalid"),
  grade: z
    .string()
    .min(1, "Grade is required")
    .refine(isObjectId, "Grade id is invalid"),
  subjectStream: optionalSubjectStream,
});

export const updateModuleSchema = z.object({
  name: z.string().min(1, "Module name cannot be empty").trim().optional(),
  description: z.string().optional(),
  thumbnailUrl: optionalThumbnailUrl,
  level: z.string().refine(isObjectId, "Level id is invalid").optional(),
  grade: z.string().refine(isObjectId, "Grade id is invalid").optional(),
  subjectStream: optionalSubjectStream,
});

const ensureLevelAndGradeExist = async ({ levelId, gradeId }) => {
  const [levelRecord, gradeRecord] = await Promise.all([
    Level.findById(levelId),
    Grade.findById(gradeId),
  ]);

  if (!levelRecord) {
    throw new ModuleValidationError("Selected level is invalid.");
  }

  if (!gradeRecord) {
    throw new ModuleValidationError("Selected grade is invalid.");
  }

  return { gradeRecord };
};

const ensureStreamRules = ({ gradeName, subjectStream }) => {
  const gradeNumber = parseGradeNumber(gradeName);

  if (gradeNumber !== null && gradeNumber >= 12) {
    if (!subjectStream || !STREAMS.includes(subjectStream)) {
      throw new ModuleValidationError(
        "Subject stream is required for grades 12 and 13.",
      );
    }
  }

  if (gradeNumber !== null && gradeNumber < 12 && subjectStream) {
    throw new ModuleValidationError(
      "Subject stream can only be selected for grades 12 and 13.",
    );
  }
};

const ensureModuleUniqueness = async ({
  name,
  level,
  grade,
  subjectStream,
  excludeModuleId,
}) => {
  const query = {
    name,
    level,
    grade,
    subjectStream,
  };

  if (excludeModuleId) {
    query._id = { $ne: excludeModuleId };
  }

  const existingModule = await Module.findOne(query);
  if (existingModule) {
    throw new ModuleValidationError(
      "Module with this name already exists for selected level/grade/stream.",
    );
  }
};

export const validateCreateModuleBusinessRules = async ({
  name,
  level,
  grade,
  subjectStream,
}) => {
  const normalizedName = name.trim();
  const normalizedSubjectStream =
    subjectStream === undefined ? null : subjectStream;

  const { gradeRecord } = await ensureLevelAndGradeExist({
    levelId: level,
    gradeId: grade,
  });

  ensureStreamRules({
    gradeName: gradeRecord.name,
    subjectStream: normalizedSubjectStream,
  });

  await ensureModuleUniqueness({
    name: normalizedName,
    level,
    grade,
    subjectStream: normalizedSubjectStream,
  });

  return {
    normalizedName,
    normalizedSubjectStream,
    nextLevel: level,
    nextGrade: grade,
  };
};

export const validateUpdateModuleBusinessRules = async ({
  moduleId,
  currentName,
  currentLevel,
  currentGrade,
  currentSubjectStream,
  name,
  level,
  grade,
  subjectStream,
}) => {
  const nextLevel = level || currentLevel;
  const nextGrade = grade || currentGrade;
  const normalizedName = name?.trim() || currentName;
  const normalizedSubjectStream =
    subjectStream !== undefined ? subjectStream : currentSubjectStream;

  if (!nextLevel) {
    throw new ModuleValidationError("Level is required.");
  }

  if (!nextGrade) {
    throw new ModuleValidationError("Grade is required.");
  }

  const { gradeRecord } = await ensureLevelAndGradeExist({
    levelId: nextLevel,
    gradeId: nextGrade,
  });

  ensureStreamRules({
    gradeName: gradeRecord.name,
    subjectStream: normalizedSubjectStream,
  });

  await ensureModuleUniqueness({
    name: normalizedName,
    level: nextLevel,
    grade: nextGrade,
    subjectStream: normalizedSubjectStream,
    excludeModuleId: moduleId,
  });

  return {
    normalizedName,
    normalizedSubjectStream,
    nextLevel,
    nextGrade,
  };
};