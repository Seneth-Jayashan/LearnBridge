import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";

// --- 1. Create Quiz (Teacher) ---
export const createQuiz = async (req, res) => {
    try {
        const { title, courseId, questions, timeLimit } = req.body;

        const newQuiz = new Quiz({
            title,
            courseId,
            questions,
            timeLimit,
            createdBy: req.user._id,
        });

        await newQuiz.save();

        res.status(201).json({ message: "Quiz created successfully", quizId: newQuiz._id });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 2. Get All Quizzes Created by Teacher ---
export const getTeacherQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ createdBy: req.user._id, isDeleted: false })
            .populate("courseId", "title");

        res.status(200).json(quizzes);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 3. Update Quiz (Teacher) ---
export const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz || quiz.isDeleted) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        // Security Check: Ensure quiz belongs to THIS teacher
        if (quiz.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to update this quiz." });
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });

        res.status(200).json({ message: "Quiz updated successfully", quiz: updatedQuiz });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 4. Delete Quiz (Soft Delete, Teacher) ---
export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz || quiz.isDeleted) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        // Security Check: Ensure quiz belongs to THIS teacher
        if (quiz.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this quiz." });
        }

        quiz.isDeleted = true;
        await quiz.save();

        res.status(200).json({ message: "Quiz deleted successfully." });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 5. Get Published Quizzes for a Course (Student) ---
export const getQuizzesByCourse = async (req, res) => {
    try {
        const quizzes = await Quiz.find({
            courseId: req.params.courseId,
            isPublished: true,
            isDeleted: false,
        }).select("-questions.correctAnswer"); // Hide correct answers from students

        res.status(200).json(quizzes);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 6. Get Single Quiz by ID (Student) ---
export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, isDeleted: false })
            .select("-questions.correctAnswer"); // Hide correct answers from students

        if (!quiz) return res.status(404).json({ message: "Quiz not found." });

        res.status(200).json(quiz);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 7. Submit Quiz (Student) ---
export const submitQuiz = async (req, res) => {
    try {
        const { answers, flaggedQuestions } = req.body;

        // Fetch full quiz WITH correct answers for grading
        const quiz = await Quiz.findOne({ _id: req.params.id, isDeleted: false });

        if (!quiz) return res.status(404).json({ message: "Quiz not found." });

        // Auto-grade: compare student answers against correct answers
        let score = 0;
        quiz.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) score++;
        });

        const newResult = new QuizResult({
            quizId:           quiz._id,
            studentId:        req.user._id,
            answers,
            score,
            totalQuestions:   quiz.questions.length,
            flaggedQuestions: flaggedQuestions || [],
        });

        await newResult.save();

        res.status(201).json({
            message:        "Quiz submitted successfully",
            score,
            totalQuestions: quiz.questions.length,
            correctAnswers: quiz.questions.map((question) => question.correctAnswer),
            resultId:       newResult._id,
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 8. Get Student's Past Quiz Results ---
export const getStudentResults = async (req, res) => {
    try {
        const results = await QuizResult.find({
            studentId: req.user._id,
            isDeleted: false,
        }).populate("quizId", "title timeLimit");

        res.status(200).json(results);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};