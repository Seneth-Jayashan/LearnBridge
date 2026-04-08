import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import quizService from "../../services/QuizService.jsx";

export default function QuizResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await quizService.getStudentResults();
        setResults(Array.isArray(data) ? data : data.results || []);
      } catch {
        setError("Failed to load your results.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const getScoreColor = (score, total) => {
    const pct = (score / total) * 100;
    if (pct >= 70) return "text-emerald-700 bg-emerald-50 border border-emerald-200";
    if (pct >= 40) return "text-amber-700 bg-amber-50 border border-amber-200";
    return "text-red-700 bg-red-50 border border-red-200";
  };

  const getScoreLabel = (score, total) => {
    const pct = (score / total) * 100;
    if (pct >= 70) return "Passed";
    if (pct >= 40) return "Needs Work";
    return "Failed";
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="flex items-center gap-3 text-[#207D86] font-medium animate-pulse">
        <div className="w-2 h-2 bg-[#207D86] rounded-full animate-bounce" />
        Loading your results...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
              My Quiz Results
            </h2>
            <p className="text-slate-500 mt-2 text-sm md:text-base">
              Track your quiz attempts and performance over time.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all active:scale-[0.98]"
          >
            Back
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
        {results.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📊
            </div>
            <p className="text-slate-800 font-semibold text-lg mb-1">No quiz attempts yet</p>
            <p className="text-slate-500 text-sm">Complete a quiz to see your results here.</p>
          </div>
        ) : (
          <>
            {/* ── Summary Stats ─────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-xl shadow-slate-200/40">
                <p className="text-2xl font-black text-slate-800">{results.length}</p>
                <p className="text-xs text-slate-500 mt-1">Quizzes Taken</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-xl shadow-slate-200/40">
                <p className="text-2xl font-black text-emerald-700">
                  {results.filter(r => (r.score / r.totalQuestions) >= 0.7).length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Passed</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-xl shadow-slate-200/40">
                <p className="text-2xl font-black text-[#207D86]">
                  {results.length > 0
                    ? Math.round(
                        results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) /
                        results.length
                      )
                    : 0}%
                </p>
                <p className="text-xs text-slate-500 mt-1">Avg Score</p>
              </div>
            </div>

            {/* ── Results List ──────────────────────────────────── */}
            <div className="space-y-3">
              {results.map((result) => {
                const pct = Math.round((result.score / result.totalQuestions) * 100);
                return (
                  <div
                    key={result._id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4 shadow-xl shadow-slate-200/40 hover:border-[#207D86]/30 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold text-slate-800 truncate mb-1">
                        {result.quizId?.title || "Unknown Quiz"}
                      </h2>
                      <p className="text-xs text-slate-500">
                        📅 {formatDate(result.completedAt)}
                        {result.flaggedQuestions?.length > 0 && (
                          <span className="ml-2 text-red-600/80">
                            🚩 {result.flaggedQuestions.length} flagged
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getScoreColor(result.score, result.totalQuestions)}`}>
                        {getScoreLabel(result.score, result.totalQuestions)}
                      </span>
                      <div className="text-right">
                        <p className={`text-xl font-black
                          ${pct >= 70 ? "text-emerald-700" : pct >= 40 ? "text-amber-700" : "text-red-700"}`}
                        >
                          {pct}%
                        </p>
                        <p className="text-xs text-slate-500">{result.score}/{result.totalQuestions}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}