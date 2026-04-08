import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import quizService from "../../services/QuizService.jsx";

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
        const data = await quizService.getQuizById(id);
        const quizData = data.quiz || data;
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
      const data = await quizService.submitQuiz(id, { answers, flaggedQuestions: flagged });
      setResult(data);
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="flex items-center gap-3 text-[#207D86] font-medium animate-pulse">
        <div className="w-2 h-2 bg-[#207D86] rounded-full animate-bounce" />
        Loading quiz...
      </div>
    </div>
  );

  if (error && !quiz) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 px-8 py-10">
        <p className="text-red-600 text-xl mb-2">⚠️</p>
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-[#207D86] underline text-sm hover:text-[#18646b] transition"
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-5">
          <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
                Quiz Results
              </h2>
              <p className="text-slate-500 mt-2 text-sm md:text-base">
                {quiz.title}
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
              {error}
            </div>
          )}

          {/* Score Card */}
          <div className={`rounded-2xl p-6 text-center border shadow-xl
            ${percentage >= 70
              ? "bg-emerald-50 border-emerald-200"
              : percentage >= 40
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className={`text-6xl font-black mb-2
              ${percentage >= 70 ? "text-emerald-700" : percentage >= 40 ? "text-amber-700" : "text-red-700"}`}
            >
              {percentage}%
            </div>
            <p className="text-lg font-semibold text-slate-800">
              {result.score} out of {result.totalQuestions} correct
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {percentage >= 70 ? "Great work!" : percentage >= 40 ? "Keep studying!" : "Don't give up, try again!"}
            </p>
            {flagged.length > 0 && (
              <p className="text-sm text-red-600 mt-2">
                You flagged {flagged.length} question{flagged.length > 1 ? "s" : ""} for review
              </p>
            )}
          </div>

          {/* Answer Review */}
          <h2 className="text-sm font-bold text-[#207D86] uppercase tracking-widest">
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
                className={`bg-white rounded-2xl border p-5 shadow-xl shadow-slate-200/40
                  ${isFlagged
                    ? "border-red-200"
                    : isCorrect
                      ? "border-emerald-200"
                      : "border-red-100"
                  }`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className={`text-sm font-bold shrink-0 mt-0.5
                    ${isCorrect ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </span>
                  <p className="font-semibold text-slate-800 text-sm">
                    Q{i + 1}: {q.questionText}
                    {isFlagged && (
                      <span className="ml-2 text-red-600 text-xs">Flagged</span>
                    )}
                  </p>
                </div>

                <div className="space-y-2 ml-5">
                  {q.options.map((opt, oIndex) => {
                    const isCorrectOpt = oIndex === correctAnswer;
                    const isStudentOpt = oIndex === studentAnswer;

                    let style = "border-slate-200 bg-slate-50 text-slate-600";
                    if (isCorrectOpt) style = "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold";
                    else if (isStudentOpt && !isCorrect) style = "border-red-200 bg-red-50 text-red-700";

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
                          <span className="text-xs text-emerald-700">Correct</span>
                        )}
                        {isStudentOpt && !isCorrect && (
                          <span className="text-xs text-red-700">Your answer</span>
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
              className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition font-medium text-sm"
            >
              Back to Module
            </button>
            <button
              onClick={() => navigate("/student/results")}
              className="flex-1 py-3 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition font-medium text-sm shadow-lg shadow-[#207D86]/20"
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
    <div className="min-h-screen bg-slate-50">

      {/* ── Sticky Header with Timer ─────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-slate-800">{quiz.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {answeredCount}/{quiz.questions.length} answered
              {flagged.length > 0 && (
                <span className="ml-2 text-red-600">· {flagged.length} flagged</span>
              )}
            </p>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-base
            ${timeLeft < 60
              ? "bg-red-50 text-red-700 border border-red-200 animate-pulse"
              : timeLeft < 300
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-[#207D86]/10 text-[#207D86] border border-[#207D86]/20"
            }`}
          >
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="w-full h-1 bg-slate-200 rounded-full">
            <div
              className="h-1 bg-[#207D86] rounded-full transition-all"
              style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
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
                ${currentQ === i ? "ring-2 ring-[#207D86]/50" : ""}
                ${flagged.includes(i)
                  ? "bg-red-50 border-red-200 text-red-700"
                  : answers[i] !== null
                    ? "bg-[#207D86] border-transparent text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-[#207D86]/40"
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
            <div className={`bg-white rounded-2xl border p-6 shadow-xl shadow-slate-200/40 transition
              ${isFlagged ? "border-red-200" : "border-slate-100"}`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-[#207D86] uppercase tracking-widest">
                    Question {currentQ + 1} of {quiz.questions.length}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{q.questionText}</p>
                </div>

                {/* Flag Button */}
                <button
                  onClick={() => toggleFlag(currentQ)}
                  title={isFlagged ? "Remove flag" : "Flag for review"}
                  className={`ml-4 shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                    ${isFlagged
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      : "bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600"
                    }`}
                >
                  {isFlagged ? "Flagged" : "Flag"}
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
                        ? "border-[#207D86]/40 bg-[#207D86]/10 text-slate-800"
                        : "border-slate-200 bg-slate-50 hover:border-[#207D86]/40 hover:bg-[#207D86]/5 text-slate-700"
                      }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${answers[currentQ] === oIndex
                        ? "bg-[#207D86] text-white"
                        : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </button>
                ))}
              </div>

              {isFlagged && (
                <p className="text-xs text-red-600/80 mt-3">
                  This question is flagged for review. You can still change your answer.
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
            className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition text-sm font-medium disabled:opacity-30"
          >
            ← Previous
          </button>

          {currentQ < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              className="flex-1 py-2.5 bg-[#207D86]/10 text-[#207D86] border border-[#207D86]/20 rounded-xl hover:bg-[#207D86]/20 transition text-sm font-medium"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition text-sm font-semibold shadow-lg shadow-[#207D86]/20 disabled:opacity-40"
            >
              {submitting ? "Submitting..." : `Submit Quiz (${answeredCount}/${quiz.questions.length} answered)`}
            </button>
          )}
        </div>

        {/* Flagged Warning */}
        {flagged.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <strong>{flagged.length} flagged question{flagged.length > 1 ? "s" : ""}:</strong>{" "}
            Q{flagged.map((i) => i + 1).join(", Q")} - review these before submitting.
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}