import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText:  { type: String,  required: true },
    options:       [{ type: String, required: true }], 
    correctAnswer: { type: Number,  required: true },  
    isFlagged:     { type: Boolean, default: false },  
  }
);

const quizSchema = new mongoose.Schema(
  {
    title:     { type: String,  required: true, trim: true },
    moduleId:  { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },

    questions:   [questionSchema],
    timeLimit:   { type: Number,  required: true },      
    isPublished: { type: Boolean, default: false },
    isDeleted:   { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;