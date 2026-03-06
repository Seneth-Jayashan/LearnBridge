import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
  },
  { timestamps: true },
);
export const Grade = mongoose.model("Grade", gradeSchema);

export default Grade;
