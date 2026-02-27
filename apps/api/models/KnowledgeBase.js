import mongoose from "mongoose";

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: "" },
    content: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "General" },
    attachmentUrl: { type: String, trim: true, default: "" },
    isPublished: { type: Boolean, default: true },
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

knowledgeBaseSchema.index({ title: "text", summary: "text", content: "text", category: "text" });
knowledgeBaseSchema.index({ isPublished: 1, updatedAt: -1 });

const KnowledgeBase = mongoose.model("KnowledgeBase", knowledgeBaseSchema);

export default KnowledgeBase;
