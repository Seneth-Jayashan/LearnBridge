import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSchoolAdmin } from "../../contexts/SchoolAdminContext";

const formatDate = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString([], { dateStyle: "medium" });
};

const SchoolDashboard = () => {
  const {
    schoolDetails,
    students,
    verifiedTeachers,
    pendingTeachers,
    loading,
  } = useSchoolAdmin();

  const stats = useMemo(() => {
    const activeStudents = students.filter((student) => student?.isActive).length;

    return {
      students: students.length,
      activeStudents,
      teachers: verifiedTeachers.length,
      pendingTeachers: pendingTeachers.length,
    };
  }, [students, verifiedTeachers, pendingTeachers]);

  const recentStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [students]);

  const recentPendingTeachers = useMemo(() => {
    return [...pendingTeachers]
      .sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [pendingTeachers]);

  return (
    <section className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">School Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {schoolDetails?.name || schoolDetails?.schoolName || "Your school"} at a glance.
          </p>
        </div>

        <Link
          to="/school/students/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 transition-all w-full md:w-auto"
        >
          + Add Student
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Students</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.students}</p>
          <p className="text-xs text-slate-500 mt-1">{loading ? "-" : `${stats.activeStudents} active`}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Faculty</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.teachers}</p>
          <p className="text-xs text-slate-500 mt-1">Verified teachers</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Pending Requests</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0E2A47]">{loading ? "-" : stats.pendingTeachers}</p>
          <p className="text-xs text-amber-700 mt-1">Teachers awaiting approval</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">School Profile</p>
          <p className="mt-2 text-lg font-bold text-[#0E2A47] line-clamp-1">
            {schoolDetails?.name || schoolDetails?.schoolName || "Not available"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {schoolDetails?.district || schoolDetails?.city || schoolDetails?.contactEmail || "No location set"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-7">
        <Link to="/school/students" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Manage Students</p>
          <p className="text-sm text-slate-500 mt-1">View student records and update status.</p>
        </Link>

        <Link to="/school/teachers" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Manage Teachers</p>
          <p className="text-sm text-slate-500 mt-1">Approve and organize faculty members.</p>
        </Link>

        <Link to="/school/needsRegistry" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">Needs Registry</p>
          <p className="text-sm text-slate-500 mt-1">Post and track school resource requests.</p>
        </Link>

        <Link to="/school/profile" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#207D86]/40 hover:shadow-md transition-all">
          <p className="text-sm font-bold text-[#0E2A47]">School Profile</p>
          <p className="text-sm text-slate-500 mt-1">Update school identity and contact details.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#0E2A47]">Recently Added Students</h2>
            <Link to="/school/students" className="text-sm font-semibold text-[#207D86] hover:text-[#18646b]">View All</Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading students...</p>
          ) : recentStudents.length === 0 ? (
            <p className="text-sm text-slate-500">No students available.</p>
          ) : (
            <ul className="space-y-3">
              {recentStudents.map((student) => (
                <li key={student._id} className="border border-slate-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">
                    {`${student?.firstName || ""} ${student?.lastName || ""}`.trim() || student?.email || "Unnamed student"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {student?.grade?.name || "No grade"} · {formatDate(student?.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#0E2A47]">Pending Teacher Requests</h2>
            <Link to="/school/teachers" className="text-sm font-semibold text-[#207D86] hover:text-[#18646b]">Review</Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading requests...</p>
          ) : recentPendingTeachers.length === 0 ? (
            <p className="text-sm text-slate-500">No pending teacher requests.</p>
          ) : (
            <ul className="space-y-3">
              {recentPendingTeachers.map((teacher) => (
                <li key={teacher._id} className="border border-slate-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">
                    {`${teacher?.firstName || ""} ${teacher?.lastName || ""}`.trim() || teacher?.email || "Unnamed teacher"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{teacher?.email || "No email"} · {formatDate(teacher?.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
};

export default SchoolDashboard;
