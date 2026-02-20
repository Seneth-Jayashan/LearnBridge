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
        setResults(res.data.results);
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
    if (pct >= 70) return "text-green-600 bg-green-100";
    if (pct >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
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

  if (loading) return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center">
      <div className="text-indigo-600 font-medium animate-pulse">Loading your results...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-800 mb-0.5 block">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-800">My Quiz Results</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            ⚠️ {error}
          </div>
        )}

        {results.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-lg font-medium">No quiz attempts yet</p>
            <p className="text-sm mt-1">Complete a quiz to see your results here.</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
                <p className="text-2xl font-black text-indigo-600">{results.length}</p>
                <p className="text-xs text-gray-500 mt-1">Quizzes Taken</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
                <p className="text-2xl font-black text-green-600">
                  {results.filter(r => (r.score / r.totalQuestions) >= 0.7).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Passed</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
                <p className="text-2xl font-black text-gray-700">
                  {results.length > 0
                    ? Math.round(results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Avg Score</p>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-3">
              {results.map((result) => {
                const pct = Math.round((result.score / result.totalQuestions) * 100);
                return (
                  <div
                    key={result._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold text-gray-800 truncate mb-1">
                        {result.quizId?.title || "Unknown Quiz"}
                      </h2>
                      <p className="text-xs text-gray-400">
                        📅 {formatDate(result.completedAt)}
                        {result.flaggedQuestions?.length > 0 && (
                          <span className="ml-2 text-red-400">🚩 {result.flaggedQuestions.length} flagged</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getScoreColor(result.score, result.totalQuestions)}`}>
                        {getScoreLabel(result.score, result.totalQuestions)}
                      </span>
                      <div className="text-right">
                        <p className={`text-xl font-black ${pct >= 70 ? "text-green-600" : pct >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                          {pct}%
                        </p>
                        <p className="text-xs text-gray-400">{result.score}/{result.totalQuestions}</p>
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