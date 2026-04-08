import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/AdminService";
import moduleService from "../../services/ModuleService";
import levelService from "../../services/LevelService";
import gradeService from "../../services/GradeService";

const formatDate = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString([], { dateStyle: "medium" });
};

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [modules, setModules] = useState([]);
  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [usersRes, schoolsRes, modulesRes, levelsRes, gradesRes] = await Promise.allSettled([
          adminService.getAllUsers(),
          adminService.getAllSchools(),
          moduleService.getAllModules(),
          levelService.getAllLevels(),
          gradeService.getAllGrades(),
        ]);

        if (usersRes.status === "fulfilled") setUsers(toArray(usersRes.value, ["users", "data", "items"]));
        if (schoolsRes.status === "fulfilled") setSchools(toArray(schoolsRes.value, ["schools", "data", "items"]));
        if (modulesRes.status === "fulfilled") setModules(toArray(modulesRes.value, ["modules", "data", "items"]));
        if (levelsRes.status === "fulfilled") setLevels(toArray(levelsRes.value, ["levels", "data", "items"]));
        if (gradesRes.status === "fulfilled") setGrades(toArray(gradesRes.value, ["grades", "data", "items"]));

        const failedCalls = [usersRes, schoolsRes, modulesRes, levelsRes, gradesRes].filter(
          (result) => result.status === "rejected",
        );
        if (failedCalls.length > 0) {
          setError("Some dashboard metrics could not be loaded.");
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const teacherCount = users.filter((row) => row?.role?.toLowerCase?.() === "teacher").length;
    const studentCount = users.filter((row) => row?.role?.toLowerCase?.() === "student").length;

    return {
      users: users.length,
      teachers: teacherCount,
      students: studentCount,
      schools: schools.length,
      modules: modules.length,
      levels: levels.length,
      grades: grades.length,
    };
  }, [users, schools, modules, levels, grades]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [users]);

  const recentSchools = useMemo(() => {
    return [...schools]
      .sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [schools]);

  return (
    <section className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Here is a snapshot of your platform.
          </p>
        </div>

        <Link
          to="/admin/users/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 transition-all w-full md:w-auto"
        >
          + Create User
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Users</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.users}</p>
          <p className="text-xs text-slate-500 mt-1">{loading ? "-" : `${stats.teachers} teachers · ${stats.students} students`}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Schools</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.schools}</p>
          <p className="text-xs text-slate-500 mt-1">Active institutions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Modules</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.modules}</p>
          <p className="text-xs text-slate-500 mt-1">Learning modules configured</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Academic Setup</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.grades}</p>
          <p className="text-xs text-slate-500 mt-1">{loading ? "-" : `${stats.levels} levels configured`}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-7">
        <Link to="/admin/users" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Manage Users</p>
          <p className="text-sm text-slate-500 mt-1">Create, edit, and review user accounts.</p>
        </Link>

        <Link to="/admin/schools" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Manage Schools</p>
          <p className="text-sm text-slate-500 mt-1">Add schools and keep institution data updated.</p>
        </Link>

        <Link to="/admin/modules/manage" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Manage Modules</p>
          <p className="text-sm text-slate-500 mt-1">Organize syllabus modules for each grade.</p>
        </Link>

        <Link to="/admin/grades/manage" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Manage Grades</p>
          <p className="text-sm text-slate-500 mt-1">Maintain grade and level definitions.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#0E2A47]">Recently Added Users</h2>
            <Link to="/admin/users" className="text-sm font-semibold text-[#207D86] hover:text-[#18646b]">View All</Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading users...</p>
          ) : recentUsers.length === 0 ? (
            <p className="text-sm text-slate-500">No users available.</p>
          ) : (
            <ul className="space-y-3">
              {recentUsers.map((row) => (
                <li key={row._id} className="border border-slate-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">
                    {`${row?.firstName || ""} ${row?.lastName || ""}`.trim() || row?.email || "Unnamed user"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(row?.role || "unknown").replace("_", " ")} · {formatDate(row?.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#0E2A47]">Recently Added Schools</h2>
            <Link to="/admin/schools" className="text-sm font-semibold text-[#207D86] hover:text-[#18646b]">View All</Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading schools...</p>
          ) : recentSchools.length === 0 ? (
            <p className="text-sm text-slate-500">No schools available.</p>
          ) : (
            <ul className="space-y-3">
              {recentSchools.map((school) => (
                <li key={school._id} className="border border-slate-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">{school?.name || school?.schoolName || "Unnamed school"}</p>
                  <p className="text-xs text-slate-500 mt-1">{school?.district || school?.city || school?.contactEmail || "Unknown location"} · {formatDate(school?.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
};

export default Dashboard;