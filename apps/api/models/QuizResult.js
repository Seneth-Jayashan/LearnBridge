import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ type: Number }], // student's chosen option index per question
  score: { type: Number },
  totalQuestions: { type: Number },
  flaggedQuestions: [{ type: Number }], // indexes of questions student flagged
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("QuizResult", quizResultSchema);