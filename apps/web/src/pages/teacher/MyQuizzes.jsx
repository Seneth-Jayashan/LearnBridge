import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeacherQuizzes, deleteQuiz, publishQuiz } from "../../services/QuizService.jsx";

export default function MyQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuizzes = async () => {
    try {
      const res = await getTeacherQuizzes();
      setQuizzes(res.data.quizzes);
    } catch {
      setError("Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz? This cannot be undone.")) return;
    try {
      await deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q._id !== id));
    } catch {
      alert("Failed to delete quiz.");
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishQuiz(id);
      setQuizzes((prev) =>
        prev.map((q) => (q._id === id ? { ...q, isPublished: true } : q))
      );
    } catch {
      alert("Failed to publish quiz.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center">
      <div className="text-indigo-600 font-medium animate-pulse">Loading your quizzes...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">My Quizzes</h1>
        <button
          onClick={() => navigate("/teacher/quiz/create")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          + Create Quiz
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            ⚠️ {error}
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-medium">No quizzes yet</p>
            <p className="text-sm mt-1">Create your first quiz to get started</p>
            <button
              onClick={() => navigate("/teacher/quiz/create")}
              className="mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              Create a Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-gray-800 truncate">{quiz.title}</h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                        ${quiz.isPublished ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {quiz.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    📚 {quiz.courseId?.title || "Unknown Course"} &nbsp;·&nbsp;
                    ❓ {quiz.questions?.length || 0} questions &nbsp;·&nbsp;
                    ⏱ {quiz.timeLimit} min
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!quiz.isPublished && (
                    <button
                      onClick={() => handlePublish(quiz._id)}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/teacher/quiz/edit/${quiz._id}`)}
                    className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(quiz._id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}