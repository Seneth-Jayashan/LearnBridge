import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import quizService from "../../../services/QuizService.jsx";

// ── Toast Component ───────────────────────────────────────────────────
const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-300
      ${type === "success"
        ? "bg-white border border-emerald-100 text-emerald-700"
        : "bg-white border border-red-100 text-red-700"
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
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
      const quizList = Array.isArray(data) ? data : data.quizzes || [];
      const sortedByNewest = [...quizList].sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      setQuizzes(sortedByNewest);
    } catch {
      setError("Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id, isPublished = false) => {
    if (isPublished) {
      showToast("Published quizzes cannot be deleted.", "error");
      return;
    }
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

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-[#207D86] font-medium">
        <div className="w-8 h-8 border-4 border-t-[#207D86] border-slate-200 rounded-full animate-spin" />
        Loading your quizzes...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Toast message={toast.message} type={toast.type} />

      <div className="max-w-5xl mx-auto py-12 px-6">
        {/* --- HERO SECTION (UNCHANGED) --- */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        {/* --- UPDATED LIST STYLE --- */}
        {quizzes.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              📂
            </div>
            <h3 className="text-[#0E2A47] font-bold text-xl mb-2">No quizzes found</h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Get started by creating your first interactive quiz for your students.</p>
            <button
              onClick={() => navigate("/teacher/quiz/create")}
              className="px-8 py-3 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition font-bold shadow-md"
            >
              Start Creating
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="group bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-[#207D86]/20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[#0E2A47] group-hover:text-[#207D86] transition-colors leading-tight">
                        {quiz.title}
                      </h3>
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-bold
                        ${quiz.isPublished
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}
                      >
                        {quiz.isPublished ? "Live" : "Draft"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-slate-500 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="opacity-60 text-base">📝</span>
                        {quiz.questions?.length || 0} Questions
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="flex items-center gap-1.5">
                        <span className="opacity-60 text-base">⏱️</span>
                        {quiz.timeLimit} mins
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => navigate(`/teacher/quiz/${quiz._id}/results`)}
                      className="flex-1 md:flex-none px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      Analytics
                    </button>
                    
                    {!quiz.isPublished && (
                      <button
                        onClick={() => handlePublish(quiz._id)}
                        className="flex-1 md:flex-none px-4 py-2 text-sm font-bold bg-[#207D86] text-white rounded-lg hover:bg-[#18646b] shadow-sm transition"
                      >
                        Publish Now
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/teacher/quiz/edit/${quiz._id}`)}
                      className="p-2 text-slate-400 hover:text-[#207D86] hover:bg-[#207D86]/5 rounded-lg transition"
                      title="Edit Quiz"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDelete(quiz._id, quiz.isPublished)}
                      disabled={quiz.isPublished}
                      className={`p-2 rounded-lg transition ${quiz.isPublished
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
                      title={quiz.isPublished ? "Published quizzes cannot be deleted" : "Delete Quiz"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}