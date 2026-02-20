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
        setQuizzes(res.data.quizzes);
      } catch {
        setError("Failed to load quizzes.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [courseId]);

  if (loading) return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center">
      <div className="text-indigo-600 font-medium animate-pulse">Loading quizzes...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-800 mb-1 block">
          ← Back to Course
        </button>
        <h1 className="text-xl font-bold text-gray-800">Available Quizzes</h1>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            ⚠️ {error}
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-medium">No quizzes available yet</p>
            <p className="text-sm">Check back later — your teacher may upload one soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 hover:shadow-md transition"
              >
                <div>
                  <h2 className="text-base font-semibold text-gray-800 mb-1">{quiz.title}</h2>
                  <p className="text-sm text-gray-500">
                    ❓ {quiz.questions?.length || "?"} questions &nbsp;·&nbsp;
                    ⏱ {quiz.timeLimit} minutes
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/student/quiz/${quiz._id}`)}
                  className="flex-shrink-0 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-semibold"
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