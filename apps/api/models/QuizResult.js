import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema(
  {
    quizId:    { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    answers:          [{ type: Number }], 
    flaggedQuestions: [{ type: Number }], 

    score:          { type: Number },
    totalQuestions: { type: Number },

    completedAt: { type: Date, default: Date.now },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const QuizResult = mongoose.model("QuizResult", quizResultSchema);
export default QuizResult;