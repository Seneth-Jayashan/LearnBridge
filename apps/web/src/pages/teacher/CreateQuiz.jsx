import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuiz } from "../../services/QuizService.js";

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return setError(`Question ${i + 1} text is empty.`);
      if (q.options.some((o) => !o.trim())) return setError(`All options in Question ${i + 1} must be filled.`);
    }

    try {
      setLoading(true);
      await createQuiz({ title, courseId, timeLimit: Number(timeLimit), questions, isPublished });
      navigate("/teacher/quizzes");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 transition">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-800">Create New Quiz</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium text-sm"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
          >
            {loading ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Quiz Settings Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Quiz Settings</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Quiz Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Algebra Basics"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Course ID</label>
            <input
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="Paste the course ID this quiz belongs to"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Time Limit: <span className="text-indigo-600 font-semibold">{timeLimit} minutes</span>
            </label>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 min</span>
              <span>120 min</span>
            </div>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                Question {qIndex + 1}
              </span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-xs text-red-400 hover:text-red-600 transition"
                >
                  ✕ Remove
                </button>
              )}
            </div>

            <input
              value={q.questionText}
              onChange={(e) => updateQuestionText(qIndex, e.target.value)}
              placeholder="Enter your question here..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Options — click ✓ to mark correct answer
              </p>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <button
                    onClick={() => setCorrectAnswer(qIndex, oIndex)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition font-bold text-sm
                      ${q.correctAnswer === oIndex
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 text-gray-300 hover:border-green-400"
                      }`}
                  >
                    ✓
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    className={`flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition
                      ${q.correctAnswer === oIndex
                        ? "border-green-400 bg-green-50 focus:ring-green-300"
                        : "border-gray-300 focus:ring-indigo-400"
                      }`}
                  />
                  <span className="text-xs text-gray-400 w-4">
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400">
              ✅ Correct answer: <span className="text-green-600 font-medium">Option {String.fromCharCode(65 + q.correctAnswer)}</span>
            </p>
          </div>
        ))}

        {/* Add Question Button */}
        <button
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-2xl text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 transition font-medium text-sm"
        >
          + Add Another Question
        </button>
      </div>
    </div>
  );
}