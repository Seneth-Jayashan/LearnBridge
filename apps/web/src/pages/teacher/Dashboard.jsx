import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import lessonService from "../../services/LessonService";
import assignmentService from "../../services/AssignmentService";
import knowledgeBaseService from "../../services/KnowledgeBaseService";
import quizService from "../../services/QuizService";

const isValidDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const formatDate = (value) => {
  if (!isValidDate(value)) return "No date";
  return new Date(value).toLocaleDateString([], { dateStyle: "medium" });
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [kbEntries, setKbEntries] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [lessonsRes, assignmentsRes, kbRes, quizzesRes] = await Promise.allSettled([
          lessonService.getAllLessons(),
          assignmentService.getAllAssignments(),
          knowledgeBaseService.getAllEntries(),
          quizService.getTeacherQuizzes(),
        ]);

        if (lessonsRes.status === "fulfilled") {
          setLessons(Array.isArray(lessonsRes.value) ? lessonsRes.value : []);
        }

        if (assignmentsRes.status === "fulfilled") {
          setAssignments(Array.isArray(assignmentsRes.value) ? assignmentsRes.value : []);
        }

        if (kbRes.status === "fulfilled") {
          setKbEntries(Array.isArray(kbRes.value) ? kbRes.value : []);
        }

        if (quizzesRes.status === "fulfilled") {
          const quizList = Array.isArray(quizzesRes.value)
            ? quizzesRes.value
            : quizzesRes.value?.quizzes || [];
          setQuizzes(Array.isArray(quizList) ? quizList : []);
        }

        const failedCalls = [lessonsRes, assignmentsRes, kbRes, quizzesRes].filter(
          (result) => result.status === "rejected",
        );
        if (failedCalls.length > 0) {
          setError("Some dashboard data could not be loaded. You can still use quick actions.");
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(now.getDate() + 7);

    const dueSoonCount = assignments.filter((assignment) => {
      const dueAt = assignment?.dueDate || assignment?.dueAt || assignment?.deadline;
      if (!isValidDate(dueAt)) return false;
      const dueDate = new Date(dueAt);
      return dueDate >= now && dueDate <= inSevenDays;
    }).length;

    const publishedKbCount = kbEntries.filter((entry) => entry?.isPublished).length;
    const publishedQuizCount = quizzes.filter((quiz) => quiz?.isPublished).length;

    const uniqueModuleIds = new Set(
      lessons.map((lesson) => lesson?.module?._id).filter(Boolean),
    );

    return {
      lessons: lessons.length,
      assignments: assignments.length,
      dueSoon: dueSoonCount,
      modules: uniqueModuleIds.size,
      kbEntries: kbEntries.length,
      kbPublished: publishedKbCount,
      quizzes: quizzes.length,
      quizzesPublished: publishedQuizCount,
      quizzesDraft: Math.max(quizzes.length - publishedQuizCount, 0),
    };
  }, [lessons, assignments, kbEntries, quizzes]);

  const upcomingAssignments = useMemo(() => {
    return [...assignments]
      .filter((assignment) => isValidDate(assignment?.dueDate || assignment?.dueAt || assignment?.deadline))
      .sort((a, b) => {
        const aDate = new Date(a?.dueDate || a?.dueAt || a?.deadline).getTime();
        const bDate = new Date(b?.dueDate || b?.dueAt || b?.deadline).getTime();
        return aDate - bDate;
      })
      .slice(0, 4);
  }, [assignments]);

  const recentLessons = useMemo(() => {
    return [...lessons]
      .sort((a, b) => {
        const aDate = new Date(a?.createdAt || 0).getTime();
        const bDate = new Date(b?.createdAt || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 4);
  }, [lessons]);

  return (
    <section className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Track your class activity and jump into your workflow.
          </p>
        </div>

        <Link
          to="/teacher/quiz/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 transition-all w-full md:w-auto"
        >
          + Create Quiz
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Lessons</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : dashboardStats.lessons}</p>
          <p className="text-xs text-slate-500 mt-1">Across {loading ? "-" : dashboardStats.modules} modules</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Assignments</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : dashboardStats.assignments}</p>
          <p className="text-xs text-amber-700 mt-1">{loading ? "-" : dashboardStats.dueSoon} due in 7 days</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Knowledge Base</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : dashboardStats.kbEntries}</p>
          <p className="text-xs text-emerald-700 mt-1">{loading ? "-" : dashboardStats.kbPublished} published</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Quizzes</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : dashboardStats.quizzes}</p>
          <p className="text-xs text-slate-500 mt-1">
            {loading ? "-" : `${dashboardStats.quizzesPublished} live · ${dashboardStats.quizzesDraft} draft`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
        <Link
          to="/teacher/lessons/manage"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all"
        >
          <p className="text-sm font-bold text-[#0E2A47]">Manage Lessons</p>
          <p className="text-sm text-slate-500 mt-1">Review lesson materials and update your content library.</p>
        </Link>

        <Link
          to="/teacher/assignments/manage"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all"
        >
          <p className="text-sm font-bold text-[#0E2A47]">Manage Assignments</p>
          <p className="text-sm text-slate-500 mt-1">Monitor tasks and submissions from one place.</p>
        </Link>

        <Link
          to="/teacher/knowledge-base/manage"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all"
        >
          <p className="text-sm font-bold text-[#0E2A47]">Knowledge Base</p>
          <p className="text-sm text-slate-500 mt-1">Keep learning resources fresh and easy to discover.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#0E2A47]">Upcoming Assignment Deadlines</h2>
            <Link to="/teacher/assignments/manage" className="text-sm font-semibold text-[#207D86] hover:text-[#18646b]">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading assignments...</p>
          ) : upcomingAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming due dates found.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingAssignments.map((assignment) => {
                const dueAt = assignment?.dueDate || assignment?.dueAt || assignment?.deadline;
                return (
                  <li key={assignment._id} className="border border-slate-200 rounded-xl px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-800">{assignment?.title || "Untitled assignment"}</p>
                    <p className="text-xs text-slate-500 mt-1">Due {formatDate(dueAt)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#0E2A47]">Recently Added Lessons</h2>
            <Link to="/teacher/lessons/manage" className="text-sm font-semibold text-[#207D86] hover:text-[#18646b]">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading lessons...</p>
          ) : recentLessons.length === 0 ? (
            <p className="text-sm text-slate-500">No lessons available yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentLessons.map((lesson) => (
                <li key={lesson._id} className="border border-slate-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">{lesson?.title || "Untitled lesson"}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lesson?.module?.name || "Unknown module"} · {formatDate(lesson?.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
};

export default TeacherDashboard;
