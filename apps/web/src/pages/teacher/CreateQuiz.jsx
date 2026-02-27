import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import quizService from "../../services/QuizService.jsx";
import triviaService from "../../services/Triviaservice.jsx";

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

// ── Trivia Import Modal ───────────────────────────────────────────────
const TriviaImportModal = ({ onClose, onImport }) => {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("import"); // "import" | "generate"
  const [config, setConfig] = useState({ amount: 10, category: "", difficulty: "" });

  useEffect(() => {
    triviaService.fetchCategories()
      .then(setCategories)
      .catch(() => setError("Failed to load categories."))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleImport = async () => {
    setError("");
    setImporting(true);
    try {
      const questions = await triviaService.fetchQuestions(config);
      const categoryName = categories.find((c) => c.id === Number(config.category))?.name || "";
      onImport({ questions, mode, category: categoryName });
      onClose();
    } catch (err) {
      setError(err.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0A1D32] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌐</span>
            <h2 className="text-sm font-bold text-white">Import from Open Trivia DB</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-lg leading-none">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Mode Toggle */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Import Mode</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("import")}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-left
                  ${mode === "import"
                    ? "bg-[#207D86]/20 border-[#207D86]/50 text-[#4CAF50]"
                    : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
              >
                <div className="text-base mb-0.5">➕</div>
                Add to existing quiz
                <div className="text-slate-500 font-normal mt-0.5">Appends questions</div>
              </button>
              <button
                onClick={() => setMode("generate")}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-left
                  ${mode === "generate"
                    ? "bg-[#207D86]/20 border-[#207D86]/50 text-[#4CAF50]"
                    : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
              >
                <div className="text-base mb-0.5">⚡</div>
                Auto-generate quiz
                <div className="text-slate-500 font-normal mt-0.5">Replaces everything</div>
              </button>
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Number of Questions: <span className="text-[#4CAF50]">{config.amount}</span>
            </label>
            <input
              type="range" min={1} max={50}
              value={config.amount}
              onChange={(e) => setConfig((p) => ({ ...p, amount: Number(e.target.value) }))}
              className="w-full accent-[#4CAF50]"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>1</span><span>50</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
            {loadingCats ? (
              <div className="text-xs text-slate-500 animate-pulse">Loading categories...</div>
            ) : (
              <select
                value={config.category}
                onChange={(e) => setConfig((p) => ({ ...p, category: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#207D86] transition"
              >
                <option value="">Any Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0A1D32]">{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {["", "easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setConfig((p) => ({ ...p, difficulty: d }))}
                  className={`py-2 rounded-xl text-xs font-semibold border transition capitalize
                    ${config.difficulty === d
                      ? d === ""       ? "bg-[#207D86]/20 border-[#207D86]/50 text-[#4CAF50]"
                        : d === "easy"   ? "bg-green-400/15 border-green-400/30 text-green-400"
                        : d === "medium" ? "bg-yellow-400/15 border-yellow-400/30 text-yellow-400"
                        :                  "bg-red-400/15 border-red-400/30 text-red-400"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                >
                  {d === "" ? "Any" : d}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Mode hint */}
          <p className="text-xs text-slate-500">
            {mode === "import"
              ? "✅ Imported questions will be appended to your current quiz questions."
              : "⚠️ Auto-generate will replace your current questions and pre-fill the quiz title with the selected category."
            }
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || loadingCats}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-lg shadow-[#207D86]/30 disabled:opacity-40"
            >
              {importing
                ? "Fetching..."
                : mode === "import" ? `Import ${config.amount} Questions` : "Generate Quiz"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [showTriviaModal, setShowTriviaModal] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const resetForm = () => {
    setTitle("");
    setModuleId("");
    setTimeLimit(10);
    setQuestions([emptyQuestion()]);
    setError("");
  };

  // ── Trivia Import Handler ──────────────────────────────────────────
  const handleTriviaImport = ({ questions: imported, mode, category }) => {
    if (mode === "import") {
      setQuestions((prev) => {
        const isStarterBlank =
          prev.length === 1 && !prev[0].questionText && prev[0].options.every((o) => !o);
        return isStarterBlank ? imported : [...prev, ...imported];
      });
      showToast(`${imported.length} questions imported successfully!`, "success");
    } else {
      setQuestions(imported);
      if (category) setTitle(`${category} Quiz`);
      setTimeLimit(Math.min(Math.max(Math.round(imported.length * 1.5), 5), 120));
      showToast(`Quiz auto-generated with ${imported.length} questions!`, "success");
    }
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
    if (!moduleId.trim()) return setError("Module ID is required.");
    if (!/^[a-fA-F0-9]{24}$/.test(moduleId.trim()))
      return setError("Module ID is not valid. Please paste a correct MongoDB ObjectId.");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return setError(`Question ${i + 1} text is empty.`);
      if (q.options.some((o) => !o.trim()))
        return setError(`All options in Question ${i + 1} must be filled.`);
    }

    try {
      setLoading(true);
      await quizService.createQuiz({
        title,
        moduleId: moduleId.trim(),
        timeLimit: Number(timeLimit),
        questions,
        isPublished,
      });

      showToast(
        isPublished ? "Quiz created & published successfully!" : "Quiz saved as draft successfully!",
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

      {/* Trivia Modal */}
      {showTriviaModal && (
        <TriviaImportModal
          onClose={() => setShowTriviaModal(false)}
          onImport={handleTriviaImport}
        />
      )}

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

          {/* Settings header with Trivia button */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest">
              Quiz Settings
            </h2>
            <button
              onClick={() => setShowTriviaModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#207D86]/15 border border-[#207D86]/30 text-[#4CAF50] rounded-lg hover:bg-[#207D86]/25 transition text-xs font-semibold"
            >
              🌐 Import from Trivia DB
            </button>
          </div>

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

          {/* Module ID */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Module ID
              <span className="ml-2 text-xs text-slate-600 font-normal">
                (MongoDB ObjectId of the module)
              </span>
            </label>
            <input
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              placeholder="e.g. 6998a9b741f544ca50307646"
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition
                ${moduleId && !/^[a-fA-F0-9]{24}$/.test(moduleId)
                  ? "border-red-400/40 focus:ring-red-400"
                  : "border-white/10 focus:ring-[#207D86]"
                }`}
            />
            {moduleId && !/^[a-fA-F0-9]{24}$/.test(moduleId) && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                Must be a 24-character MongoDB ObjectId
              </p>
            )}
            {moduleId && /^[a-fA-F0-9]{24}$/.test(moduleId) && (
              <p className="text-xs text-[#4CAF50] mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full" />
                Valid Module ID
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
              type="range" min={5} max={120} step={5}
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

        {/* ── Questions Count Banner ────────────────────────────── */}
        {questions.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#207D86]/10 border border-[#207D86]/20 rounded-xl">
            <span className="text-xs text-[#4CAF50] font-semibold">
              📋 {questions.length} questions in this quiz
            </span>
            <button
              onClick={() => setQuestions([emptyQuestion()])}
              className="text-xs text-red-400/50 hover:text-red-400 transition"
            >
              Clear all
            </button>
          </div>
        )}

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

        {/* ── Bottom Action Bar ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={addQuestion}
            className="py-4 border-2 border-dashed border-[#207D86]/30 rounded-2xl text-[#207D86] hover:border-[#4CAF50]/50 hover:text-[#4CAF50] hover:bg-[#4CAF50]/5 transition font-medium text-sm"
          >
            + Add Question Manually
          </button>
          <button
            onClick={() => setShowTriviaModal(true)}
            className="py-4 border-2 border-dashed border-[#207D86]/30 rounded-2xl text-[#207D86] hover:border-[#4CAF50]/50 hover:text-[#4CAF50] hover:bg-[#4CAF50]/5 transition font-medium text-sm flex items-center justify-center gap-2"
          >
            🌐 Import from Trivia DB
          </button>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}