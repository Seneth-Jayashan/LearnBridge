import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import courseService from "../../../services/CourseService";

const CoursesManage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = async () => {
    try {
      setError("");
      const data = await courseService.getAllCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDelete = async (courseId) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this course?");
    if (!shouldDelete) return;

    setError("");
    try {
      await courseService.deleteCourse(courseId);
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course");
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Manage Courses</h2>
        <p className="text-slate-600 mt-1">Edit and delete your existing courses.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Your Courses</h3>
        </div>

        {isLoading ? (
          <p className="px-5 py-6 text-slate-600">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="px-5 py-6 text-slate-600">No courses created yet.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {courses.map((course) => (
              <div key={course._id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{course.name}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {course.shortDescription || "No short description"}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {course.subject || "-"} • {course.grade || "-"} • {course.language || "-"}
                  </p>
                  {course.stream && (
                    <p className="text-xs text-slate-500 mt-1">{course.stream}</p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/teacher/courses/edit/${course._id}`)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(course._id)}
                    className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesManage;
