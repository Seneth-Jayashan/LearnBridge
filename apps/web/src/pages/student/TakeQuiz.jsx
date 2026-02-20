import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizById, submitQuiz } from "../../services/QuizService.jsx";

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState([]); // indexes of flagged questions
  const [timeLeft, setTimeLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentQ, setCurrentQ] = useState(0); // for question navigation

  // ── Fetch Quiz ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await getQuizById(id);
        setQuiz(res.data.quiz);
        setAnswers(new Array(res.data.quiz.questions.length).fill(null));
        setTimeLeft(res.data.quiz.timeLimit * 60);
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
    if (timeLeft === 0) {
      handleSubmit();
      return;
    }
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

  // ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center">
      <div className="text-indigo-600 font-medium animate-pulse">Loading quiz...</div>
    </div>
  );

  if (error && !quiz) return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center">
      <div className="text-red-500 text-center">
        <p className="text-xl mb-2">⚠️</p>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 underline text-sm">Go back</button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════════════
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-[#f5f3ff]">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Quiz Results — {quiz.title}</h1>
        </div>

        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Score Card */}
          <div className={`rounded-2xl p-6 text-center border-2 shadow-sm
            ${percentage >= 70 ? "bg-green-50 border-green-300" : percentage >= 40 ? "bg-yellow-50 border-yellow-300" : "bg-red-50 border-red-300"}`}
          >
            <div className={`text-6xl font-black mb-2
              ${percentage >= 70 ? "text-green-600" : percentage >= 40 ? "text-yellow-600" : "text-red-600"}`}
            >
              {percentage}%
            </div>
            <p className="text-lg font-semibold text-gray-700">
              {result.score} out of {result.totalQuestions} correct
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {percentage >= 70 ? "🎉 Great work!" : percentage >= 40 ? "📖 Keep studying!" : "💪 Don't give up, try again!"}
            </p>
            {flagged.length > 0 && (
              <p className="text-sm text-red-500 mt-2">
                🚩 You flagged {flagged.length} question{flagged.length > 1 ? "s" : ""} for review
              </p>
            )}
          </div>

          {/* Answer Review */}
          <h2 className="text-lg font-bold text-gray-700">Answer Review</h2>

          {quiz.questions.map((q, i) => {
            const studentAnswer = answers[i];
            const correctAnswer = result.correctAnswers[i];
            const isCorrect = studentAnswer === correctAnswer;
            const isFlagged = flagged.includes(i);

            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border-2 p-5 shadow-sm
                  ${isFlagged ? "border-red-300" : isCorrect ? "border-green-300" : "border-red-200"}`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className={`text-sm font-bold flex-shrink-0 mt-0.5
                    ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                    {isCorrect ? "✓" : "✗"}
                  </span>
                  <p className="font-semibold text-gray-800 text-sm">
                    Q{i + 1}: {q.questionText}
                    {isFlagged && <span className="ml-2 text-red-400 text-xs">🚩 Flagged</span>}
                  </p>
                </div>

                <div className="space-y-2 ml-5">
                  {q.options.map((opt, oIndex) => {
                    const isCorrectOpt = oIndex === correctAnswer;
                    const isStudentOpt = oIndex === studentAnswer;

                    let style = "border-gray-200 bg-gray-50 text-gray-600";
                    if (isCorrectOpt) style = "border-green-400 bg-green-100 text-green-800 font-semibold";
                    else if (isStudentOpt && !isCorrect) style = "border-red-300 bg-red-100 text-red-700";

                    return (
                      <div key={oIndex} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${style}`}>
                        <span className="font-bold text-xs w-5">{String.fromCharCode(65 + oIndex)}.</span>
                        <span className="flex-1">{opt}</span>
                        {isCorrectOpt && <span className="text-xs text-green-600">✓ Correct</span>}
                        {isStudentOpt && !isCorrect && <span className="text-xs text-red-500">Your answer</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              ← Back to Course
            </button>
            <button
              onClick={() => navigate("/student/results")}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
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
    <div className="min-h-screen bg-[#f5f3ff]">
      {/* Sticky Header with Timer */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-800">{quiz.title}</h1>
            <p className="text-xs text-gray-500">
              {answeredCount}/{quiz.questions.length} answered
              {flagged.length > 0 && <span className="ml-2 text-red-400">· 🚩 {flagged.length} flagged</span>}
            </p>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg
            ${timeLeft < 60 ? "bg-red-100 text-red-600 animate-pulse" : timeLeft < 300 ? "bg-yellow-100 text-yellow-700" : "bg-indigo-100 text-indigo-700"}`}
          >
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="w-full h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-indigo-500 rounded-full transition-all"
              style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Question Navigation Pills */}
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition border
                ${currentQ === i ? "ring-2 ring-indigo-400" : ""}
                ${flagged.includes(i)
                  ? "bg-red-100 border-red-300 text-red-600"
                  : answers[i] !== null
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-300 text-gray-600 hover:border-indigo-300"
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current Question Card */}
        {(() => {
          const q = quiz.questions[currentQ];
          const isFlagged = flagged.includes(currentQ);

          return (
            <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition
              ${isFlagged ? "border-red-300" : "border-gray-100"}`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
                    Question {currentQ + 1} of {quiz.questions.length}
                  </span>
                  <p className="text-base font-semibold text-gray-800 mt-1">{q.questionText}</p>
                </div>

                {/* Flag Button */}
                <button
                  onClick={() => toggleFlag(currentQ)}
                  title={isFlagged ? "Remove flag" : "Flag for review"}
                  className={`ml-4 flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                    ${isFlagged
                      ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                      : "bg-gray-50 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400"
                    }`}
                >
                  🚩 {isFlagged ? "Flagged" : "Flag"}
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q.options.map((opt, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => selectAnswer(currentQ, oIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition
                      ${answers[currentQ] === oIndex
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700"
                      }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${answers[currentQ] === oIndex
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </button>
                ))}
              </div>

              {isFlagged && (
                <p className="text-xs text-red-400 mt-3">
                  🚩 This question is flagged for review. You can still change your answer.
                </p>
              )}
            </div>
          );
        })()}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentQ((q) => Math.max(q - 1, 0))}
            disabled={currentQ === 0}
            className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-medium disabled:opacity-40"
          >
            ← Previous
          </button>

          {currentQ < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm font-semibold"
            >
              {submitting ? "Submitting..." : `Submit Quiz (${answeredCount}/${quiz.questions.length} answered)`}
            </button>
          )}
        </div>

        {/* Flagged Questions Warning */}
        {flagged.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            🚩 <strong>{flagged.length} flagged question{flagged.length > 1 ? "s" : ""}:</strong>{" "}
            Q{flagged.map((i) => i + 1).join(", Q")} — review these before submitting.
          </div>
        )}
      </div>
    </div>
  );
}