import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    shortDescription: { type: String, trim: true, default: "" },
    fullDescription: { type: String, trim: true, default: "" },
    language: { type: String, trim: true, default: "" },
    subject: { type: String, trim: true, default: "" },
    grade: { type: String, trim: true, default: "" },
    stream: { type: String, trim: true, default: "" },
    thumbnailUrl: { type: String, trim: true, default: "" },
    introVideoUrl: { type: String, trim: true, default: "" },
    durationHours: { type: Number, min: 0, default: 0 },
    numberOfLessons: { type: Number, min: 0, default: 0 },
    instructor: { type: String, trim: true, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
  },
  { timestamps: true },
);

courseSchema.index({ name: 1, createdBy: 1 }, { unique: true });

const Course = mongoose.model("Course", courseSchema);
export default Course;