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
      const normalizedAnswers = (quiz?.questions || []).map((_, index) => answers[index] ?? null);
      const data = await quizService.submitQuiz(id, {
        answers: normalizedAnswers,
        flaggedQuestions: flagged,
      });
      setResult(data);
      setSubmitted(true);
    } catch {
      setError("Submission failed. Please try again.");
      setSubmitting(false);
    }
  }, [id, answers, flagged, submitted, submitting, quiz]);

  // ── Countdown Timer ────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) {
      setTimeLeft(0);
      handleSubmit();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => Math.max((t ?? 0) - 1, 0));
    }, 1000);

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
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl px-8 py-10 text-center shadow-2xl shadow-slate-300/30">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-[#207D86]/20 border-t-[#207D86] animate-spin" />
        <p className="text-[#0E2A47] text-lg font-bold">Preparing your quiz</p>
        <p className="mt-1 text-sm text-slate-500">Loading questions and timer...</p>
      </div>
    </div>
  );

  if (error && !quiz) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white px-8 py-10 text-center shadow-2xl shadow-slate-300/30">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-600">
          !
        </div>
        <p className="text-red-700 text-sm font-medium">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/85 backdrop-blur-xl p-6 shadow-xl shadow-slate-300/25">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#207D86]">Quiz Completed</p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0E2A47]">Quiz Results</h2>
                <p className="mt-2 text-sm text-slate-500 md:text-base">{quiz.title}</p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Module
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Score</p>
                <p className="mt-1 text-xl font-extrabold text-[#0E2A47]">{result.score}/{result.totalQuestions}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Accuracy</p>
                <p className="mt-1 text-xl font-extrabold text-[#207D86]">{percentage}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Flagged</p>
                <p className="mt-1 text-xl font-extrabold text-red-600">{flagged.length}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
              {error}
            </div>
          )}

          {/* Score Card */}
          <div className={`rounded-3xl p-7 text-center border shadow-xl
            ${percentage >= 70
              ? "bg-emerald-50 border-emerald-200"
              : percentage >= 40
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className={`text-7xl font-black mb-2 leading-none
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
          <h2 className="text-sm font-bold text-[#207D86] uppercase tracking-[0.2em]">
            Answer Review
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {quiz.questions.map((q, i) => {
            const studentAnswer = answers[i];
            const correctAnswer = result.correctAnswers[i];
            const isCorrect = studentAnswer === correctAnswer;
            const isFlagged = flagged.includes(i);

            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border p-5 shadow-lg shadow-slate-200/50
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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Module
            </button>
            <button
              onClick={() => navigate("/student/results")}
              className="flex-1 rounded-xl bg-[#207D86] py-3 text-sm font-semibold text-white shadow-lg shadow-[#207D86]/25 transition hover:bg-[#18646b]"
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
      <div className="sticky top-0 z-10 px-4 pt-4 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white/85 backdrop-blur-xl shadow-xl shadow-slate-300/25">
          <div className="border-b border-slate-200/80 bg-linear-to-r from-[#207D86]/10 via-sky-100/60 to-teal-100/60 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#207D86]">Live Quiz Session</p>
                <h1 className="mt-1 text-xl font-extrabold leading-tight text-[#0E2A47] md:text-2xl">{quiz.title}</h1>
                <p className="mt-2 text-sm text-slate-600">
                  {answeredCount}/{quiz.questions.length} answered
                  {flagged.length > 0 && (
                    <span className="ml-2 text-red-600">· {flagged.length} flagged</span>
                  )}
                </p>
              </div>

              <div className={`inline-flex items-center gap-3 rounded-xl border px-4 py-2.5 font-mono text-base font-bold shadow-sm
                ${timeLeft < 60
                  ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                  : timeLeft < 300
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-white text-[#207D86] border-[#207D86]/30"
                }`}
              >
                <span className="text-xs uppercase tracking-wider">Time Left</span>
                <span className="text-lg leading-none">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Completion</p>
              <p className="text-xs font-bold text-slate-700">{Math.round((answeredCount / quiz.questions.length) * 100)}%</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-2 rounded-full bg-linear-to-r from-[#207D86] via-[#2c919a] to-[#18646b] transition-all duration-300"
                style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[1fr_260px] lg:px-6">
        <div className="space-y-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
            {error}
          </div>
        )}

        {/* ── Question Navigation Pills ──────────────────────────── */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
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
            <div className={`rounded-3xl border bg-white p-6 shadow-xl shadow-slate-200/45 transition md:p-7
              ${isFlagged ? "border-red-200" : "border-slate-100"}`}
            >
              {/* Question Header */}
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="inline-flex rounded-full bg-[#207D86]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#207D86]">
                    Question {currentQ + 1} of {quiz.questions.length}
                  </span>
                  <p className="mt-3 text-base font-semibold leading-relaxed text-slate-800">{q.questionText}</p>
                </div>

                {/* Flag Button */}
                <button
                  onClick={() => toggleFlag(currentQ)}
                  title={isFlagged ? "Remove flag" : "Flag for review"}
                  className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition
                    ${isFlagged
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      : "bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600"
                    }`}
                >
                  {isFlagged ? "Flagged" : "Flag"}
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q.options.map((opt, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => selectAnswer(currentQ, oIndex)}
                    className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200
                      ${answers[currentQ] === oIndex
                        ? "border-[#207D86]/45 bg-[#207D86]/10 text-slate-800 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#207D86]/35 hover:bg-white"
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
                    <span className="text-sm font-semibold">{opt}</span>
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
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <button
            onClick={() => setCurrentQ((q) => Math.max(q - 1, 0))}
            disabled={currentQ === 0}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition text-sm font-semibold disabled:opacity-30"
          >
            ← Previous
          </button>

          {currentQ < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              className="flex-1 py-2.5 bg-[#207D86]/10 text-[#207D86] border border-[#207D86]/20 rounded-xl hover:bg-[#207D86]/20 transition text-sm font-semibold"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition text-sm font-semibold shadow-lg shadow-[#207D86]/25 disabled:opacity-40"
            >
              {submitting ? "Submitting..." : `Submit Quiz (${answeredCount}/${quiz.questions.length} answered)`}
            </button>
          )}

          {currentQ < quiz.questions.length - 1 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="py-2.5 px-4 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition text-sm font-semibold shadow-lg shadow-[#207D86]/20 disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "Submit Now"}
            </button>
          )}
        </div>

        {/* Flagged Warning */}
        {flagged.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>{flagged.length} flagged question{flagged.length > 1 ? "s" : ""}:</strong>{" "}
            Q{flagged.map((i) => i + 1).join(", Q")} - review these before submitting.
          </div>
        )}

        <div className="h-6" />
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#207D86]">Questions</p>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`h-9 rounded-lg text-xs font-bold transition border
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

          <div className="mt-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#207D86]" /> Answered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-200" /> Flagged</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-slate-300 bg-white" /> Unanswered</div>
          </div>
        </aside>
      </div>
    </div>
  );
}