import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentResults } from "../../services/QuizService.jsx";

export default function QuizResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await getStudentResults();
        // Handle both array and wrapped response
        setResults(Array.isArray(res.data) ? res.data : res.data.results || []);
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
    if (pct >= 70) return "text-[#4CAF50] bg-[#4CAF50]/15 border border-[#4CAF50]/20";
    if (pct >= 40) return "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20";
    return "text-red-400 bg-red-400/10 border border-red-400/20";
  };

  const getScoreLabel = (score, total) => {
    const pct = (score / total) * 100;
    if (pct >= 70) return "🎉 Passed";
    if (pct >= 40) return "📖 Needs Work";
    return "❌ Failed";
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0E1E30] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#4CAF50] font-medium animate-pulse">
        <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" />
        Loading your results...
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
          ← Back
        </button>
        <h1 className="text-lg font-bold text-white tracking-wide">My Quiz Results</h1>
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
        {results.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-16 h-16 bg-[#0A1D32] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📊
            </div>
            <p className="text-white font-semibold text-lg mb-1">No quiz attempts yet</p>
            <p className="text-slate-500 text-sm">Complete a quiz to see your results here.</p>
          </div>
        ) : (
          <>
            {/* ── Summary Stats ─────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#0A1D32] rounded-2xl p-4 text-center border border-white/5 shadow-xl">
                <p className="text-2xl font-black text-white">{results.length}</p>
                <p className="text-xs text-slate-500 mt-1">Quizzes Taken</p>
              </div>
              <div className="bg-[#0A1D32] rounded-2xl p-4 text-center border border-white/5 shadow-xl">
                <p className="text-2xl font-black text-[#4CAF50]">
                  {results.filter(r => (r.score / r.totalQuestions) >= 0.7).length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Passed</p>
              </div>
              <div className="bg-[#0A1D32] rounded-2xl p-4 text-center border border-white/5 shadow-xl">
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
                    className="bg-[#0A1D32] rounded-2xl border border-white/5 p-5 flex items-center justify-between gap-4 shadow-xl hover:border-[#207D86]/30 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold text-white truncate mb-1">
                        {result.quizId?.title || "Unknown Quiz"}
                      </h2>
                      <p className="text-xs text-slate-500">
                        📅 {formatDate(result.completedAt)}
                        {result.flaggedQuestions?.length > 0 && (
                          <span className="ml-2 text-red-400/70">
                            🚩 {result.flaggedQuestions.length} flagged
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getScoreColor(result.score, result.totalQuestions)}`}>
                        {getScoreLabel(result.score, result.totalQuestions)}
                      </span>
                      <div className="text-right">
                        <p className={`text-xl font-black
                          ${pct >= 70 ? "text-[#4CAF50]" : pct >= 40 ? "text-yellow-400" : "text-red-400"}`}
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