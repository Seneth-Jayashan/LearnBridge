import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import moduleService from "../../services/ModuleService";
import assignmentService from "../../services/AssignmentService";
import quizService from "../../services/QuizService";

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const formatDate = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString([], { dateStyle: "medium" });
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [moduleRes, assignmentRes, resultRes] = await Promise.allSettled([
          moduleService.getAllModules(),
          assignmentService.getAllAssignments(),
          quizService.getStudentResults(),
        ]);

        if (moduleRes.status === "fulfilled") {
          setModules(toArray(moduleRes.value, ["modules", "data", "items"]));
        }

        if (assignmentRes.status === "fulfilled") {
          setAssignments(toArray(assignmentRes.value, ["assignments", "data", "items"]));
        }

        if (resultRes.status === "fulfilled") {
          setResults(toArray(resultRes.value, ["results", "data", "items"]));
        }

        const failures = [moduleRes, assignmentRes, resultRes].filter((r) => r.status === "rejected");
        if (failures.length > 0) {
          setError("Some dashboard data could not be loaded.");
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const filteredModules = useMemo(() => {
    if (!user?.stream) return modules;
    return modules.filter((module) => !module?.subjectStream || module.subjectStream === user.stream);
  }, [modules, user?.stream]);

  const stats = useMemo(() => {
    const completedAssignments = assignments.filter((assignment) => assignment?.studentSubmission).length;
    const pendingAssignments = Math.max(assignments.length - completedAssignments, 0);

    const averageScore = results.length
      ? Math.round(
          results.reduce((sum, row) => sum + Number(row?.scorePercentage || row?.percentage || 0), 0) /
            results.length,
        )
      : 0;

    return {
      modules: filteredModules.length,
      assignments: assignments.length,
      pendingAssignments,
      completedAssignments,
      quizzesTaken: results.length,
      averageScore,
    };
  }, [filteredModules, assignments, results]);

  const upcomingAssignments = useMemo(() => {
    return [...assignments]
      .filter((assignment) => !assignment?.studentSubmission && assignment?.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [assignments]);

  const recentResults = useMemo(() => {
    return [...results]
      .sort((a, b) => {
        const aTime = new Date(a?.createdAt || a?.submittedAt || 0).getTime();
        const bTime = new Date(b?.createdAt || b?.submittedAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [results]);

  return (
    <section className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">Student Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Keep learning momentum and track your progress.
          </p>
        </div>

        <Link
          to="/student/modules"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 transition-all w-full md:w-auto"
        >
          Continue Learning
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Modules</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.modules}</p>
          <p className="text-xs text-slate-500 mt-1">Available for your stream</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Assignments</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.assignments}</p>
          <p className="text-xs text-amber-700 mt-1">{loading ? "-" : `${stats.pendingAssignments} pending`}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Completed Work</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.completedAssignments}</p>
          <p className="text-xs text-emerald-700 mt-1">Assignments submitted</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Quiz Progress</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.quizzesTaken}</p>
          <p className="text-xs text-slate-500 mt-1">{loading ? "-" : `Avg. score ${stats.averageScore}%`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
        <Link to="/student/modules" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Browse Modules</p>
          <p className="text-sm text-slate-500 mt-1">Watch lesson videos and download materials.</p>
        </Link>

        <Link to="/student/assignments" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">My Assignments</p>
          <p className="text-sm text-slate-500 mt-1">Submit pending work and review completed tasks.</p>
        </Link>

        <Link to="/student/quizzes" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Take Quizzes</p>
          <p className="text-sm text-slate-500 mt-1">Practice and evaluate your understanding.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#0E2A47]">Upcoming Assignments</h2>
            <Link to="/student/assignments" className="text-sm font-semibold text-[#207D86] hover:text-[#18646b]">View All</Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading assignments...</p>
          ) : upcomingAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming assignments.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <li key={assignment._id} className="border border-slate-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">{assignment?.title || "Untitled assignment"}</p>
                  <p className="text-xs text-slate-500 mt-1">Due {formatDate(assignment?.dueDate)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#0E2A47]">Recent Quiz Results</h2>
            <Link to="/student/results" className="text-sm font-semibold text-[#207D86] hover:text-[#18646b]">View All</Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading results...</p>
          ) : recentResults.length === 0 ? (
            <p className="text-sm text-slate-500">No quiz attempts yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentResults.map((result) => (
                <li key={result._id} className="border border-slate-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">{result?.quizTitle || result?.quiz?.title || "Quiz"}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Score {Math.round(Number(result?.scorePercentage || result?.percentage || 0))}% · {formatDate(result?.createdAt || result?.submittedAt)}
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

export default StudentDashboard;
