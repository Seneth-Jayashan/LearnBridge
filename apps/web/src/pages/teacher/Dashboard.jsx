import React from "react";

const TeacherDashboard = () => {
  return (
    <section className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#0E2A47]">Teacher Dashboard</h1>
      <p className="text-slate-600 mt-2">Add your dashboard content here — stats, quick links, and recent activity.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-semibold">Your Courses</h3>
          <p className="text-sm text-slate-600 mt-1">Quick link to manage courses</p>
        </div>

        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-semibold">Your Lessons</h3>
          <p className="text-sm text-slate-600 mt-1">Quick link to manage lessons</p>
        </div>

        <div className="p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-slate-600 mt-1">Recent uploads and updates appear here.</p>
        </div>
      </div>
    </section>
  );
};

export default TeacherDashboard;
