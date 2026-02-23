import mongoose from "mongoose";

const onlineMeetingSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["zoom"],
      required: true,
    },
    meetingId: { type: String, trim: true, default: "" },
    joinUrl: { type: String, trim: true, default: "" },
    startUrl: { type: String, trim: true, default: "" },
    password: { type: String, trim: true, default: "" },
    startTime: { type: Date, required: true },
    duration: { type: Number, min: 1, default: 60 },
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    materialUrl: { type: String, trim: true, default: "" },
    videoUrl: { type: String, trim: true, default: "" },
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
    onlineMeeting: {
      type: onlineMeetingSchema,
      default: null,
    },
  },
  { timestamps: true },
);

lessonSchema.index({ course: 1, title: 1, createdBy: 1 }, { unique: true });

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
