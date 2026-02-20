import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizzesByCourse } from "../../services/QuizService";

export default function QuizList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await getQuizzesByCourse(courseId);
        // Handle both array and wrapped response
        setQuizzes(Array.isArray(res.data) ? res.data : res.data.quizzes || []);
      } catch {
        setError("Failed to load quizzes.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [courseId]);

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0E1E30] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#4CAF50] font-medium animate-pulse">
        <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" />
        Loading quizzes...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0E1E30]">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-[#0A1D32] border-b border-white/5 px-6 py-4 sticky top-0 z-10 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-400 hover:text-white transition mb-1 block"
        >
          ← Back to Course
        </button>
        <h1 className="text-lg font-bold text-white tracking-wide">Available Quizzes</h1>
      </div>

      <div className="max-w-3xl mx-auto p-6">

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
              📭
            </div>
            <p className="text-white font-semibold text-lg mb-1">No quizzes available yet</p>
            <p className="text-slate-500 text-sm">Check back later — your teacher may upload one soon.</p>
          </div>
        ) : (
          // ── Quiz Cards ──────────────────────────────────────────
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-[#0A1D32] rounded-2xl border border-white/5 p-5 flex items-center justify-between gap-4 shadow-xl hover:border-[#207D86]/30 transition"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-white mb-1.5 truncate">
                    {quiz.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    ❓ {quiz.questions?.length || "?"} questions
                    &nbsp;·&nbsp;
                    ⏱ {quiz.timeLimit} minutes
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/student/quiz/${quiz._id}`)}
                  className="flex-shrink-0 px-5 py-2.5 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-lg shadow-[#207D86]/30"
                >
                  Start Quiz →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}