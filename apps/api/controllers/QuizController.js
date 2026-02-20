import Quiz from "../models/Quiz.model.js";
import QuizResult from "../models/QuizResult.model.js";

// TEACHER: Create quiz
export const createQuiz = async (req, res) => {
  try {
    const { title, courseId, questions, timeLimit } = req.body;
    const quiz = await Quiz.create({
      title, courseId, questions, timeLimit,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TEACHER: Get all quizzes they created
export const getTeacherQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id }).populate("courseId", "title");
    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TEACHER: Update quiz
export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TEACHER: Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// STUDENT: Get published quizzes for a course
export const getQuizzesByCourse = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId, isPublished: true })
      .select("-questions.correctAnswer"); // hide answers
    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// STUDENT: Get single quiz to attempt
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).select("-questions.correctAnswer");
    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// STUDENT: Submit quiz
export const submitQuiz = async (req, res) => {
  try {
    const { answers, flaggedQuestions } = req.body;
    const quiz = await Quiz.findById(req.params.id); // full quiz WITH correct answers

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });

    const result = await QuizResult.create({
      quizId: quiz._id,
      studentId: req.user._id,
      answers,
      score,
      totalQuestions: quiz.questions.length,
      flaggedQuestions: flaggedQuestions || []
    });

    // Send back with correct answers so student can review
    res.json({
      success: true,
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers: quiz.questions.map(q => q.correctAnswer),
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// STUDENT: Get their past attempts
export const getStudentResults = async (req, res) => {
  try {
    const results = await QuizResult.find({ studentId: req.user._id })
      .populate("quizId", "title timeLimit");
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};