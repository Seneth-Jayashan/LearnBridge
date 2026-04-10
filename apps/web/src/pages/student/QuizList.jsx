import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, ChevronLeft, GraduationCap, Layers, Library, Loader2 } from "lucide-react";
import quizService from "../../services/QuizService";
import moduleService from "../../services/ModuleService";
import { useAuth } from "../../contexts/AuthContext";

export default function QuizList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [quizGroups, setQuizGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        if (authLoading) return;

        if (!user) {
          setError("Please sign in to view quizzes.");
          setQuizGroups([]);
          setLoading(false);
          return;
        }

        setError("");
        setLoading(true);

        const moduleData = await moduleService.getAllModules();
        const allModules = Array.isArray(moduleData) ? moduleData : [];

        const gradeFilteredModules = user?.stream
          ? allModules.filter((module) => module.subjectStream == null || module.subjectStream === user.stream)
          : allModules;

        const relevantModules = courseId
          ? gradeFilteredModules.filter((module) => String(module._id) === String(courseId))
          : gradeFilteredModules;

        const groups = await Promise.all(
          relevantModules.map(async (module) => {
            const data = await quizService.getQuizzesByModule(module._id);
            const quizzes = Array.isArray(data) ? data : data?.quizzes || [];
            return { module, quizzes };
          })
        );

        setQuizGroups(groups.filter((group) => group.quizzes.length > 0 || courseId));
      } catch {
        setError("Failed to load quizzes.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [courseId, user, authLoading]);

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="flex items-center gap-3 text-[#207D86] font-medium animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading quizzes...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-5">
        <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
              Available Quizzes
            </h2>
            <p className="text-slate-500 mt-2 text-sm md:text-base">
              Published quizzes for your grade and assigned modules.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all active:scale-[0.98]"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Empty State ───────────────────────────────────────── */}
        {quizGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              <BookOpen className="w-8 h-8 text-[#207D86]" />
            </div>
            <p className="text-slate-800 font-semibold text-lg mb-1">No quizzes available yet</p>
            <p className="text-slate-500 text-sm">
              Check back later - your teacher may upload one soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizGroups.map(({ module, quizzes }) => (
              <div key={module._id} className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Library className="w-4 h-4 text-[#207D86]" />
                      <h3 className="text-sm font-bold text-slate-800">{module.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {module?.grade?.name || "N/A"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {module?.level?.name || "N/A"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#207D86] bg-[#207D86]/10 border border-[#207D86]/20 px-2.5 py-1 rounded-full self-start sm:self-center">
                    {quizzes.length} quiz{quizzes.length !== 1 ? "es" : ""}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  {quizzes.map((quiz) => (
                    <div key={quiz._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-[#207D86]/30 transition">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">
                          {quiz.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          ❓ {quiz.questions?.length || "?"} questions
                          &nbsp;·&nbsp;
                          ⏱ {quiz.timeLimit} minutes
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/student/quiz/${quiz._id}`)}
                        className="inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition text-sm font-semibold shadow-lg shadow-[#207D86]/20 shrink-0"
                      >
                        Start Quiz
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}