import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import quizService from "../../services/QuizService.jsx";

// ── Toast Component ───────────────────────────────────────────────────
const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-300
      ${type === "success"
        ? "bg-white border border-emerald-200 text-emerald-700"
        : "bg-white border border-red-200 text-red-700"
      }`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0
        ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
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
      const data = await quizService.getTeacherQuizzes();
      setQuizzes(Array.isArray(data) ? data : data.quizzes || []);
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
      await quizService.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q._id !== id));
      showToast("Quiz deleted successfully.", "success");
    } catch {
      showToast("Failed to delete quiz.", "error");
    }
  };

  const handlePublish = async (id) => {
    try {
      await quizService.publishQuiz(id);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#207D86] font-medium animate-pulse">
        <div className="w-2 h-2 bg-[#207D86] rounded-full animate-bounce" />
        Loading your quizzes...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} />

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
              My Quizzes
            </h2>
            <p className="text-slate-500 mt-2 text-sm md:text-base">
              Review, edit, publish, or remove quizzes you have created.
            </p>
          </div>
          <button
            onClick={() => navigate("/teacher/quiz/create")}
            className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98]"
          >
            + Create Quiz
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
            {error}
          </div>
        )}

        {/* ── Empty State ───────────────────────────────────────── */}
        {quizzes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📚
            </div>
            <p className="text-slate-800 font-semibold text-lg mb-1">No quizzes yet</p>
            <p className="text-slate-500 text-sm mb-6">Create your first quiz to get started</p>
            <button
              onClick={() => navigate("/teacher/quiz/create")}
              className="px-5 py-2.5 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition text-sm font-medium shadow-lg shadow-[#207D86]/20"
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
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4 shadow-xl shadow-slate-200/40 hover:border-[#207D86]/30 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-sm font-semibold text-slate-800 truncate">{quiz.title}</h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0
                      ${quiz.isPublished
                        ? "bg-[#207D86]/10 text-[#207D86] border border-[#207D86]/20"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
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
                <div className="flex items-center gap-2 shrink-0">
                  {!quiz.isPublished && (
                    <button
                      onClick={() => handlePublish(quiz._id)}
                      className="text-xs px-3 py-1.5 bg-[#207D86]/10 text-[#207D86] border border-[#207D86]/20 rounded-lg hover:bg-[#207D86]/20 transition font-medium"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/teacher/quiz/edit/${quiz._id}`)}
                    className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(quiz._id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600/80 rounded-lg hover:bg-red-50 hover:text-red-700 transition font-medium"
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