import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    materialUrl: { type: String, trim: true, default: "" },
    dueDate: { type: Date, default: null },
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

assignmentSchema.index({ module: 1, createdAt: -1 });
assignmentSchema.index({ createdBy: 1, createdAt: -1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;
