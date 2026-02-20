import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuiz } from "../../services/QuizService.jsx";

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

// ── Toast Component ───────────────────────────────────────────────────
const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-300
      ${type === "success"
        ? "bg-[#0A1D32] border border-[#4CAF50]/40 text-white"
        : "bg-[#0A1D32] border border-red-400/40 text-white"
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 
        ${type === "success" ? "bg-[#4CAF50]" : "bg-red-400"}`}
      />
      {message}
    </div>
  );
};

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const resetForm = () => {
    setTitle("");
    setCourseId("");
    setTimeLimit(10);
    setQuestions([emptyQuestion()]);
    setError("");
  };

  // ── Question helpers ──────────────────────────────────────────────
  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (qIndex) =>
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));

  const updateQuestionText = (qIndex, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], questionText: value };
      return updated;
    });
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[oIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const setCorrectAnswer = (qIndex, oIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], correctAnswer: oIndex };
      return updated;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (isPublished = false) => {
    setError("");
    if (!title.trim()) return setError("Quiz title is required.");
    if (!courseId.trim()) return setError("Course ID is required.");
    if (!/^[a-fA-F0-9]{24}$/.test(courseId.trim()))
      return setError("Course ID is not valid. Please paste a correct MongoDB ObjectId.");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return setError(`Question ${i + 1} text is empty.`);
      if (q.options.some((o) => !o.trim()))
        return setError(`All options in Question ${i + 1} must be filled.`);
    }

    try {
      setLoading(true);
      await createQuiz({
        title,
        courseId: courseId.trim(),
        timeLimit: Number(timeLimit),
        questions,
        isPublished,
      });

      // Show toast, reset form, stay on same page
      showToast(
        isPublished
          ? "Quiz created & published successfully!"
          : "Quiz saved as draft successfully!",
        "success"
      );
      resetForm();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to create quiz.");
      showToast("Failed to create quiz.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1E30]">

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-[#0A1D32] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition text-sm"
          >
            ← Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <h1 className="text-lg font-bold text-white tracking-wide">Create New Quiz</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-4 py-2 border border-[#207D86] text-[#4CAF50] rounded-lg hover:bg-[#207D86]/20 transition font-medium text-sm disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-lg hover:opacity-90 transition font-medium text-sm disabled:opacity-40 shadow-lg shadow-[#207D86]/30"
          >
            {loading ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-5">

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Quiz Settings Card ───────────────────────────────── */}
        <div className="bg-[#0A1D32] rounded-2xl border border-white/5 p-6 space-y-5 shadow-xl">
          <h2 className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest border-b border-white/5 pb-3">
            Quiz Settings
          </h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Quiz Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Algebra Basics"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#207D86] focus:border-transparent transition"
            />
          </div>

          {/* Course ID */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Course ID
              <span className="ml-2 text-xs text-slate-600 font-normal">
                (MongoDB ObjectId of the course)
              </span>
            </label>
            <input
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="e.g. 6998a9b741f544ca50307646"
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition
                ${courseId && !/^[a-fA-F0-9]{24}$/.test(courseId)
                  ? "border-red-400/40 focus:ring-red-400"
                  : "border-white/10 focus:ring-[#207D86]"
                }`}
            />
            {courseId && !/^[a-fA-F0-9]{24}$/.test(courseId) && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                Must be a 24-character MongoDB ObjectId
              </p>
            )}
            {courseId && /^[a-fA-F0-9]{24}$/.test(courseId) && (
              <p className="text-xs text-[#4CAF50] mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full" />
                Valid Course ID
              </p>
            )}
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Time Limit:{" "}
              <span className="text-[#4CAF50] font-semibold">{timeLimit} minutes</span>
            </label>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full accent-[#4CAF50]"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>5 min</span>
              <span>120 min</span>
            </div>
          </div>
        </div>

        {/* ── Questions ────────────────────────────────────────── */}
        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="bg-[#0A1D32] rounded-2xl border border-white/5 p-6 space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#207D86] to-[#4CAF50] flex items-center justify-center text-xs font-bold text-white">
                  {qIndex + 1}
                </div>
                <span className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest">
                  Question {qIndex + 1}
                </span>
              </div>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-xs text-red-400/50 hover:text-red-400 transition"
                >
                  ✕ Remove
                </button>
              )}
            </div>

            <input
              value={q.questionText}
              onChange={(e) => updateQuestionText(qIndex, e.target.value)}
              placeholder="Enter your question here..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#207D86] focus:border-transparent transition"
            />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Options — click ✓ to mark correct answer
              </p>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <button
                    onClick={() => setCorrectAnswer(qIndex, oIndex)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition font-bold text-sm
                      ${q.correctAnswer === oIndex
                        ? "bg-[#4CAF50] border-[#4CAF50] text-white shadow-lg shadow-[#4CAF50]/20"
                        : "border-white/20 text-white/20 hover:border-[#4CAF50]/50 hover:text-[#4CAF50]/50"
                      }`}
                  >
                    ✓
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    className={`flex-1 bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition
                      ${q.correctAnswer === oIndex
                        ? "border-[#4CAF50]/40 focus:ring-[#4CAF50] bg-[#4CAF50]/5"
                        : "border-white/10 focus:ring-[#207D86]"
                      }`}
                  />
                  <span className="text-xs text-slate-600 w-4 font-mono">
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Correct answer:{" "}
              <span className="text-[#4CAF50] font-semibold">
                Option {String.fromCharCode(65 + q.correctAnswer)}
              </span>
            </p>
          </div>
        ))}

        {/* ── Add Question ─────────────────────────────────────── */}
        <button
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-[#207D86]/30 rounded-2xl text-[#207D86] hover:border-[#4CAF50]/50 hover:text-[#4CAF50] hover:bg-[#4CAF50]/5 transition font-medium text-sm"
        >
          + Add Another Question
        </button>

        <div className="h-6" />
      </div>
    </div>
  );
}