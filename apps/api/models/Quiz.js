import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText:  { type: String,  required: true },
    options:       [{ type: String, required: true }], // always 4 items
    correctAnswer: { type: Number,  required: true },  // index of correct option (0-3)
    isFlagged:     { type: Boolean, default: false },  // teacher can flag a question
  }
);

const quizSchema = new mongoose.Schema(
  {
    title:     { type: String,  required: true, trim: true },
    moduleId:  { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },

    questions:   [questionSchema],
    timeLimit:   { type: Number,  required: true },      // in minutes
    isPublished: { type: Boolean, default: false },
    isDeleted:   { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;