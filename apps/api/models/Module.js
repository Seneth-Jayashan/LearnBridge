import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    contentUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

const Module = mongoose.model("Module", moduleSchema);
export default Module;