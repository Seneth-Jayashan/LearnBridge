import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizById, submitQuiz } from "../../services/QuizService.jsx";

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentQ, setCurrentQ] = useState(0);

  // ── Fetch Quiz ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await getQuizById(id);
        // Handle both wrapped and unwrapped response
        const quizData = res.data.quiz || res.data;
        setQuiz(quizData);
        setAnswers(new Array(quizData.questions.length).fill(null));
        setTimeLeft(quizData.timeLimit * 60);
      } catch {
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  // ── Submit Handler ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      const res = await submitQuiz(id, { answers, flaggedQuestions: flagged });
      setResult(res.data);
      setSubmitted(true);
    } catch {
      setError("Submission failed. Please try again.");
      setSubmitting(false);
    }
  }, [id, answers, flagged, submitted, submitting]);

  // ── Countdown Timer ────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft === 0) { handleSubmit(); return; }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted, handleSubmit]);

  // ── Helpers ────────────────────────────────────────────────────────
  const toggleFlag = (index) => {
    setFlagged((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const selectAnswer = (qIndex, oIndex) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[qIndex] = oIndex;
      return updated;
    });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const answeredCount = answers.filter((a) => a !== null).length;
  const percentage = result ? Math.round((result.score / result.totalQuestions) * 100) : 0;

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0E1E30] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#4CAF50] font-medium animate-pulse">
        <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" />
        Loading quiz...
      </div>
    </div>
  );

  if (error && !quiz) return (
    <div className="min-h-screen bg-[#0E1E30] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-xl mb-2">⚠️</p>
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-[#4CAF50] underline text-sm hover:text-[#207D86] transition"
        >
          Go back
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════════════
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-[#0E1E30]">

        {/* Header */}
        <div className="bg-[#0A1D32] border-b border-white/5 px-6 py-4 shadow-lg">
          <h1 className="text-lg font-bold text-white tracking-wide">
            Quiz Results — {quiz.title}
          </h1>
        </div>

        <div className="max-w-3xl mx-auto p-6 space-y-5">

          {/* Score Card */}
          <div className={`rounded-2xl p-6 text-center border shadow-xl
            ${percentage >= 70
              ? "bg-[#4CAF50]/10 border-[#4CAF50]/30"
              : percentage >= 40
                ? "bg-yellow-400/10 border-yellow-400/30"
                : "bg-red-400/10 border-red-400/30"
            }`}
          >
            <div className={`text-6xl font-black mb-2
              ${percentage >= 70 ? "text-[#4CAF50]" : percentage >= 40 ? "text-yellow-400" : "text-red-400"}`}
            >
              {percentage}%
            </div>
            <p className="text-lg font-semibold text-white">
              {result.score} out of {result.totalQuestions} correct
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {percentage >= 70 ? "🎉 Great work!" : percentage >= 40 ? "📖 Keep studying!" : "💪 Don't give up, try again!"}
            </p>
            {flagged.length > 0 && (
              <p className="text-sm text-red-400 mt-2">
                🚩 You flagged {flagged.length} question{flagged.length > 1 ? "s" : ""} for review
              </p>
            )}
          </div>

          {/* Answer Review */}
          <h2 className="text-sm font-bold text-[#4CAF50] uppercase tracking-widest">
            Answer Review
          </h2>

          {quiz.questions.map((q, i) => {
            const studentAnswer = answers[i];
            const correctAnswer = result.correctAnswers[i];
            const isCorrect = studentAnswer === correctAnswer;
            const isFlagged = flagged.includes(i);

            return (
              <div
                key={i}
                className={`bg-[#0A1D32] rounded-2xl border p-5 shadow-xl
                  ${isFlagged
                    ? "border-red-400/30"
                    : isCorrect
                      ? "border-[#4CAF50]/30"
                      : "border-red-400/20"
                  }`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className={`text-sm font-bold flex-shrink-0 mt-0.5
                    ${isCorrect ? "text-[#4CAF50]" : "text-red-400"}`}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </span>
                  <p className="font-semibold text-white text-sm">
                    Q{i + 1}: {q.questionText}
                    {isFlagged && (
                      <span className="ml-2 text-red-400 text-xs">🚩 Flagged</span>
                    )}
                  </p>
                </div>

                <div className="space-y-2 ml-5">
                  {q.options.map((opt, oIndex) => {
                    const isCorrectOpt = oIndex === correctAnswer;
                    const isStudentOpt = oIndex === studentAnswer;

                    let style = "border-white/10 bg-white/5 text-slate-400";
                    if (isCorrectOpt) style = "border-[#4CAF50]/40 bg-[#4CAF50]/10 text-[#4CAF50] font-semibold";
                    else if (isStudentOpt && !isCorrect) style = "border-red-400/30 bg-red-400/10 text-red-400";

                    return (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${style}`}
                      >
                        <span className="font-bold text-xs w-5">
                          {String.fromCharCode(65 + oIndex)}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrectOpt && (
                          <span className="text-xs text-[#4CAF50]">✓ Correct</span>
                        )}
                        {isStudentOpt && !isCorrect && (
                          <span className="text-xs text-red-400">Your answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 hover:text-white transition font-medium text-sm"
            >
              ← Back to Course
            </button>
            <button
              onClick={() => navigate("/student/results")}
              className="flex-1 py-3 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-xl hover:opacity-90 transition font-medium text-sm shadow-lg shadow-[#207D86]/30"
            >
              View All My Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // QUIZ TAKING SCREEN
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0E1E30]">

      {/* ── Sticky Header with Timer ─────────────────────────────── */}
      <div className="bg-[#0A1D32] border-b border-white/5 px-6 py-3 sticky top-0 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-white">{quiz.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {answeredCount}/{quiz.questions.length} answered
              {flagged.length > 0 && (
                <span className="ml-2 text-red-400">· 🚩 {flagged.length} flagged</span>
              )}
            </p>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-base
            ${timeLeft < 60
              ? "bg-red-400/15 text-red-400 border border-red-400/30 animate-pulse"
              : timeLeft < 300
                ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                : "bg-[#207D86]/20 text-[#4CAF50] border border-[#207D86]/30"
            }`}
          >
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="w-full h-1 bg-white/5 rounded-full">
            <div
              className="h-1 bg-gradient-to-r from-[#207D86] to-[#4CAF50] rounded-full transition-all"
              style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">

        {error && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Question Navigation Pills ──────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition border
                ${currentQ === i ? "ring-2 ring-[#4CAF50]/50" : ""}
                ${flagged.includes(i)
                  ? "bg-red-400/15 border-red-400/30 text-red-400"
                  : answers[i] !== null
                    ? "bg-gradient-to-br from-[#207D86] to-[#4CAF50] border-transparent text-white"
                    : "bg-white/5 border-white/10 text-slate-400 hover:border-[#207D86]/40"
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* ── Current Question Card ──────────────────────────────── */}
        {(() => {
          const q = quiz.questions[currentQ];
          const isFlagged = flagged.includes(currentQ);

          return (
            <div className={`bg-[#0A1D32] rounded-2xl border p-6 shadow-xl transition
              ${isFlagged ? "border-red-400/30" : "border-white/5"}`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest">
                    Question {currentQ + 1} of {quiz.questions.length}
                  </span>
                  <p className="text-sm font-semibold text-white mt-1">{q.questionText}</p>
                </div>

                {/* Flag Button */}
                <button
                  onClick={() => toggleFlag(currentQ)}
                  title={isFlagged ? "Remove flag" : "Flag for review"}
                  className={`ml-4 flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                    ${isFlagged
                      ? "bg-red-400/15 border-red-400/30 text-red-400 hover:bg-red-400/25"
                      : "bg-white/5 border-white/10 text-slate-500 hover:border-red-400/30 hover:text-red-400"
                    }`}
                >
                  🚩 {isFlagged ? "Flagged" : "Flag"}
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {q.options.map((opt, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => selectAnswer(currentQ, oIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition
                      ${answers[currentQ] === oIndex
                        ? "border-[#4CAF50]/40 bg-[#4CAF50]/10 text-white"
                        : "border-white/10 bg-white/5 hover:border-[#207D86]/40 hover:bg-[#207D86]/10 text-slate-300"
                      }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${answers[currentQ] === oIndex
                        ? "bg-[#4CAF50] text-white"
                        : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </button>
                ))}
              </div>

              {isFlagged && (
                <p className="text-xs text-red-400/70 mt-3">
                  🚩 This question is flagged for review. You can still change your answer.
                </p>
              )}
            </div>
          );
        })()}

        {/* ── Navigation Buttons ────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentQ((q) => Math.max(q - 1, 0))}
            disabled={currentQ === 0}
            className="px-4 py-2.5 border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 hover:text-white transition text-sm font-medium disabled:opacity-30"
          >
            ← Previous
          </button>

          {currentQ < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              className="flex-1 py-2.5 bg-[#207D86]/20 text-[#4CAF50] border border-[#207D86]/30 rounded-xl hover:bg-[#207D86]/30 transition text-sm font-medium"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-lg shadow-[#207D86]/30 disabled:opacity-40"
            >
              {submitting ? "Submitting..." : `Submit Quiz (${answeredCount}/${quiz.questions.length} answered)`}
            </button>
          )}
        </div>

        {/* Flagged Warning */}
        {flagged.length > 0 && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-sm text-red-400">
            🚩 <strong>{flagged.length} flagged question{flagged.length > 1 ? "s" : ""}:</strong>{" "}
            Q{flagged.map((i) => i + 1).join(", Q")} — review these before submitting.
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}