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

  const getScoreColor = (pct) => {
    if (pct >= 70) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (pct >= 40) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  const getProgressColor = (pct) => {
    if (pct >= 70) return "bg-emerald-500";
    if (pct >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-[#207D86] rounded-full animate-spin mb-4" />
      <p className="text-[#0E2A47] font-bold animate-pulse">Syncing Results...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-5xl mx-auto py-10 px-6">
        
        {/* --- HERO SECTION (UNCHANGED) --- */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-8 flex items-center gap-3 border border-red-100">
            <span className="text-xl">⚠️</span>
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        {results.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="text-5xl mb-4 text-slate-300">📁</div>
            <h3 className="text-[#0E2A47] font-bold text-xl">No history found</h3>
            <p className="text-slate-500 mt-2">Take a quiz to see your achievements here.</p>
          </div>
        ) : (
          <>
            {/* ── Dashboard Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-[#0E2A47] rounded-3xl p-6 text-white shadow-xl shadow-[#0E2A47]/20">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Attempts</p>
                <p className="text-4xl font-black">{results.length}</p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Success Rate</p>
                <p className="text-4xl font-black text-emerald-600">
                  {results.filter(r => (r.score / r.totalQuestions) >= 0.7).length}
                  <span className="text-lg text-slate-400 ml-1 font-medium">passed</span>
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Overall Average</p>
                <p className="text-4xl font-black text-[#207D86]">
                  {results.length > 0
                    ? Math.round(results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length)
                    : 0}%
                </p>
              </div>
            </div>

            {/* ── Results Cards ── */}
            <div className="grid grid-cols-1 gap-4">
              {results.map((result) => {
                const pct = Math.round((result.score / result.totalQuestions) * 100);
                return (
                  <div
                    key={result._id}
                    className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      {/* Left: Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-[#0E2A47] group-hover:text-[#207D86] transition-colors">
                            {result.quizId?.title || "Archived Quiz"}
                          </h3>
                          {result.flaggedQuestions?.length > 0 && (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase">
                              Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-tight">
                          Completed on {formatDate(result.completedAt)}
                        </p>
                      </div>

                      {/* Middle: Progress Bar (Hidden on tiny screens) */}
                      <div className="hidden lg:block w-48 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${getProgressColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Right: Score */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-bold uppercase">Accuracy</p>
                          <p className={`text-2xl font-black ${pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-600"}`}>
                            {pct}%
                          </p>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${getScoreColor(pct)}`}>
                          <span className="text-sm font-black">{result.score}</span>
                          <span className="text-[10px] font-bold opacity-70">/{result.totalQuestions}</span>
                        </div>
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