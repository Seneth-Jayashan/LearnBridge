import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import User from "../models/User.js";

// --- 1. Create Quiz (Teacher) ---
export const createQuiz = async (req, res) => {
    try {
        const { title, moduleId, questions, timeLimit } = req.body;

        const newQuiz = new Quiz({
            title,
            moduleId,
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
        const quizzes = await Quiz.find({ createdBy: req.user._id, isDeleted: false });

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

// --- 5. Get Published Quizzes for a Module (Student) ---
export const getQuizzesByModule = async (req, res) => {
    try {
        const studentSchoolId = req.user?.school;
        if (!studentSchoolId) {
            return res.status(200).json([]);
        }

        const attemptedQuizIds = await QuizResult.find({
            studentId: req.user._id,
            isDeleted: false,
        }).distinct("quizId");

        const teacherIds = await User.find({
            school: studentSchoolId,
            role: "teacher",
            isDeleted: false,
        }).distinct("_id");

        const quizzes = await Quiz.find({
            moduleId: req.params.moduleId,
            isPublished: true,
            isDeleted: false,
            createdBy: { $in: teacherIds },
            _id: { $nin: attemptedQuizIds },
        }).select("-questions.correctAnswer");

        res.status(200).json(quizzes);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 6. Get Single Quiz by ID (Student) ---
export const getQuizById = async (req, res) => {
    try {
        const studentSchoolId = req.user?.school;
        if (!studentSchoolId) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        const teacherIds = await User.find({
            school: studentSchoolId,
            role: "teacher",
            isDeleted: false,
        }).distinct("_id");

        const quiz = await Quiz.findOne({
            _id: req.params.id,
            isDeleted: false,
            isPublished: true,
            createdBy: { $in: teacherIds },
        })
            .select("-questions.correctAnswer");

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

        const quiz = await Quiz.findOne({ _id: req.params.id, isDeleted: false });

        if (!quiz) return res.status(404).json({ message: "Quiz not found." });

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

// --- 9. Get All Results for a Specific Quiz (Teacher) ---
export const getQuizResultsForTeacher = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz || quiz.isDeleted) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        if (quiz.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to view results for this quiz." });
        }

        const results = await QuizResult.find({
            quizId: quiz._id,
            isDeleted: false,
        })
            .populate("studentId", "firstName lastName email regNumber")
            .sort({ completedAt: -1, createdAt: -1 });

        return res.status(200).json({
            quiz: {
                _id: quiz._id,
                title: quiz.title,
                timeLimit: quiz.timeLimit,
                totalQuestions: quiz.questions?.length || 0,
                isPublished: quiz.isPublished,
            },
            results,
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- 10. Get All Quiz Results for Teacher (Across All Own Quizzes) ---
export const getAllQuizResultsForTeacher = async (req, res) => {
    try {
        const teacherQuizIds = await Quiz.find({
            createdBy: req.user._id,
            isDeleted: false,
        }).distinct("_id");

        const results = await QuizResult.find({
            quizId: { $in: teacherQuizIds },
            isDeleted: false,
        })
            .populate("studentId", "firstName lastName email regNumber")
            .populate("quizId", "title timeLimit")
            .sort({ completedAt: -1, createdAt: -1 });

        return res.status(200).json({ results });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};