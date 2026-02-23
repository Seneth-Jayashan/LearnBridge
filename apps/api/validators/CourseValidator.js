import { z } from "zod";

const LanguageEnum = z.enum(["Sinhala", "English", "Tamil"]);

const GradeEnum = z.enum([
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Grade 13",
]);

const StreamEnum = z.enum([
  "Mathematics Stream",
  "Biology Stream",
  "Commerce Stream",
  "Arts Stream",
  "Technology Stream",
]);

const requiresStream = (grade) => grade === "Grade 12" || grade === "Grade 13";

export const createCourseSchema = z.object({
  name: z.string().min(1, "Course name is required").trim(),
  shortDescription: z
    .string()
    .min(1, "Short description is required")
    .max(200, "Short description must be 200 characters or less")
    .trim(),
  fullDescription: z.string().min(1, "Full description is required").trim(),
  language: LanguageEnum,
  subject: z.string().min(1, "Subject is required").trim(),
  grade: GradeEnum,
  stream: StreamEnum.optional(),
  thumbnailUrl: z.string().url("Thumbnail must be a valid URL").trim().optional(),
  introVideoUrl: z.string().url("Intro video must be a valid URL").trim().optional(),
  durationHours: z.coerce
    .number()
    .positive("Course duration must be greater than 0"),
  numberOfLessons: z.coerce
    .number()
    .int("Number of lessons must be a whole number")
    .positive("Number of lessons must be greater than 0"),
  instructor: z.string().min(1, "Instructor is required").trim(),
  description: z.string().optional(),
}).superRefine((data, ctx) => {
  if (requiresStream(data.grade) && !data.stream) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stream"],
      message: "Stream is required for Grade 12 and Grade 13",
    });
  }

  if (!requiresStream(data.grade) && data.stream) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stream"],
      message: "Stream can only be set for Grade 12 and Grade 13",
    });
  }
});

// enhance create validation: check subject allowed
createCourseSchema.superRefine((data, ctx) => {
  if (!isSubjectAllowed(data.grade, data.stream, data.subject)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["subject"],
      message: "Subject is not valid for the selected grade/stream",
    });
  }
});


export const updateCourseSchema = z.object({
  name: z.string().min(1, "Course name cannot be empty").trim().optional(),
  shortDescription: z
    .string()
    .min(1, "Short description cannot be empty")
    .max(200, "Short description must be 200 characters or less")
    .trim()
    .optional(),
  fullDescription: z
    .string()
    .min(1, "Full description cannot be empty")
    .trim()
    .optional(),
  language: LanguageEnum.optional(),
  subject: z.string().min(1, "Subject cannot be empty").trim().optional(),
  grade: GradeEnum.optional(),
  stream: StreamEnum.optional(),
  thumbnailUrl: z.string().url("Thumbnail must be a valid URL").trim().optional(),
  introVideoUrl: z.string().url("Intro video must be a valid URL").trim().optional(),
  durationHours: z.coerce
    .number()
    .positive("Course duration must be greater than 0")
    .optional(),
  numberOfLessons: z.coerce
    .number()
    .int("Number of lessons must be a whole number")
    .positive("Number of lessons must be greater than 0")
    .optional(),
  instructor: z.string().min(1, "Instructor cannot be empty").trim().optional(),
  description: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.grade && requiresStream(data.grade) && !data.stream) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stream"],
      message: "Stream is required when updating to Grade 12 or Grade 13",
    });
  }

  if (data.grade && !requiresStream(data.grade) && data.stream) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stream"],
      message: "Stream can only be set for Grade 12 and Grade 13",
    });
  }
});

// enhance update validation: if subject provided, ensure it's allowed for resulting grade/stream
updateCourseSchema.superRefine((data, ctx) => {
  const grade = data.grade; // may be undefined
  const stream = data.stream;
  const subject = data.subject;

  // If both grade and subject provided, validate for new grade
  if (subject && grade) {
    if (!isSubjectAllowed(grade, stream, subject)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject"],
        message: "Subject is not valid for the selected grade/stream",
      });
    }
  }

  // If subject provided but grade not provided, we cannot fully validate unless existing course fetched in controller.
});

// Subject lists per grade / stream
const SubjectLists = {
  primary: [
    "First Language - Sinhala",
    "First Language - Tamil",
    "English",
    "Mathematics",
    "Environmental Studies",
    "Religion - Buddhism",
    "Religion - Hinduism",
    "Religion - Islam",
    "Religion - Christianity",
    "Aesthetic - Art",
    "Aesthetic - Music",
    "Aesthetic - Dancing",
    "Physical Education",
  ],
  junior: [
    "First Language - Sinhala",
    "First Language - Tamil",
    "Second National Language - Tamil",
    "Second National Language - Sinhala",
    "English",
    "Mathematics",
    "Science",
    "History",
    "Geography",
    "Religion",
    "Health & Physical Education",
    "Civic Education",
    "ICT",
    "Technology",
    "Aesthetic - Art",
    "Aesthetic - Music",
    "Aesthetic - Dancing",
    "Aesthetic - Drama",
  ],
  ol: [
    "First Language - Sinhala",
    "First Language - Tamil",
    "English",
    "Mathematics",
    "Science",
    "History",
    "Religion",
    "Geography",
    "Civic Education",
    "Business & Accounting Studies",
    "ICT",
    "Agriculture",
    "Home Science",
    "Art",
    "Music",
    "Dancing",
    "Drama",
    "Entrepreneurship Studies",
    "Second National Language",
  ],
  alStreams: {
    "Mathematics Stream": ["Combined Mathematics", "Physics", "Chemistry"],
    "Biology Stream": ["Biology", "Chemistry", "Physics"],
    "Commerce Stream": ["Accounting", "Business Studies", "Economics"],
    "Arts Stream": [
      "Political Science",
      "History",
      "Geography",
      "Sinhala / Tamil",
      "Logic",
      "Media Studies",
      "English Literature",
      "Religion-related subjects",
    ],
    "Technology Stream": [
      "Engineering Technology",
      "Bio Systems Technology",
      "Science for Technology",
      "ICT",
    ],
  },
};

const isSubjectAllowed = (grade, stream, subject) => {
  if (!subject) return false;
  if (["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5"].includes(grade)) {
    return SubjectLists.primary.includes(subject);
  }
  if (["Grade 6","Grade 7","Grade 8","Grade 9"].includes(grade)) {
    return SubjectLists.junior.includes(subject);
  }
  if (["Grade 10","Grade 11"].includes(grade)) {
    return SubjectLists.ol.includes(subject);
  }
  if (["Grade 12","Grade 13"].includes(grade)) {
    if (stream && SubjectLists.alStreams[stream]) {
      return SubjectLists.alStreams[stream].includes(subject);
    }
    // if no stream, allow any AL subject
    const all = Object.values(SubjectLists.alStreams).flat();
    return all.includes(subject);
  }
  return false;
};
