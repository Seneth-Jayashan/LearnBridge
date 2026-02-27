import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileUrl: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: "" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
assignmentSubmissionSchema.index({ student: 1, createdAt: -1 });

const AssignmentSubmission = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
export default AssignmentSubmission;
