import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeacherQuizzes, deleteQuiz, publishQuiz } from "../../services/QuizService.jsx";

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

export default function MyQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const fetchQuizzes = async () => {
    try {
      const res = await getTeacherQuizzes();
      // Backend returns array directly (no .quizzes wrapper) after our controller fix
      setQuizzes(Array.isArray(res.data) ? res.data : res.data.quizzes || []);
    } catch {
      setError("Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz? This cannot be undone.")) return;
    try {
      await deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q._id !== id));
      showToast("Quiz deleted successfully.", "success");
    } catch {
      showToast("Failed to delete quiz.", "error");
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishQuiz(id);
      setQuizzes((prev) =>
        prev.map((q) => (q._id === id ? { ...q, isPublished: true } : q))
      );
      showToast("Quiz published successfully!", "success");
    } catch {
      showToast("Failed to publish quiz.", "error");
    }
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0E1E30] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#4CAF50] font-medium animate-pulse">
        <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" />
        Loading your quizzes...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0E1E30]">

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-[#0A1D32] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <h1 className="text-lg font-bold text-white tracking-wide">My Quizzes</h1>
        <button
          onClick={() => navigate("/teacher/quiz/create")}
          className="px-4 py-2 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-lg hover:opacity-90 transition font-medium text-sm shadow-lg shadow-[#207D86]/30"
        >
          + Create Quiz
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Empty State ───────────────────────────────────────── */}
        {quizzes.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-16 h-16 bg-[#0A1D32] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📝
            </div>
            <p className="text-white font-semibold text-lg mb-1">No quizzes yet</p>
            <p className="text-slate-500 text-sm mb-6">Create your first quiz to get started</p>
            <button
              onClick={() => navigate("/teacher/quiz/create")}
              className="px-5 py-2.5 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-xl hover:opacity-90 transition text-sm font-medium shadow-lg shadow-[#207D86]/30"
            >
              Create a Quiz
            </button>
          </div>
        ) : (
          // ── Quiz List ───────────────────────────────────────────
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-[#0A1D32] rounded-2xl border border-white/5 p-5 flex items-center justify-between gap-4 shadow-xl hover:border-[#207D86]/30 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-sm font-semibold text-white truncate">{quiz.title}</h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0
                      ${quiz.isPublished
                        ? "bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/20"
                        : "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                      }`}
                    >
                      {quiz.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    ❓ {quiz.questions?.length || 0} questions
                    &nbsp;·&nbsp;
                    ⏱ {quiz.timeLimit} min
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!quiz.isPublished && (
                    <button
                      onClick={() => handlePublish(quiz._id)}
                      className="text-xs px-3 py-1.5 bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/20 rounded-lg hover:bg-[#4CAF50]/25 transition font-medium"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/teacher/quiz/edit/${quiz._id}`)}
                    className="text-xs px-3 py-1.5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/5 hover:text-white transition font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(quiz._id)}
                    className="text-xs px-3 py-1.5 border border-red-400/20 text-red-400/70 rounded-lg hover:bg-red-400/10 hover:text-red-400 transition font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}