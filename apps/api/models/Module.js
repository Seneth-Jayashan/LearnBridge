import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    thumbnailUrl: { type: String, trim: true },
    level: { type: mongoose.Schema.Types.ObjectId, ref: "Level" },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade" },
    subjectStream: {
      type: String,
      trim: true,
      enum: ["Mathematics Stream", "Biology Stream", "Commerce Stream", "Arts Stream", "Technology Stream", null],
      default: null,
    },
  },
  { timestamps: true },
);

moduleSchema.index(
  { name: 1, level: 1, grade: 1, subjectStream: 1 },
  { unique: true, name: "module_name_level_grade_stream_unique" },
);

const Module = mongoose.model("Module", moduleSchema);
export default Module;