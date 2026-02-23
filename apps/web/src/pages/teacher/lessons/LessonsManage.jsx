import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import lessonService from "../../../services/LessonService";

const toPublicMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const origin = apiBase.replace(/\/api\/v1\/?$/i, "");
  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
};

const LessonsManage = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLessons = async () => {
    try {
      setError("");
      const lessonData = await lessonService.getAllLessons();
      setLessons(Array.isArray(lessonData) ? lessonData : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  const handleDelete = async (lessonId) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this lesson?");
    if (!shouldDelete) return;

    setError("");
    try {
      await lessonService.deleteLesson(lessonId);
      await loadLessons();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete lesson");
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Manage Lessons</h2>
        <p className="text-slate-600 mt-1">Edit and delete your existing lessons.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[#0E2A47] mb-4">Your Lessons</h3>

        {isLoading ? (
          <p className="text-slate-600">Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <p className="text-slate-600">No lessons found. Add your first lesson.</p>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <article key={lesson._id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-[#0E2A47]">{lesson.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{lesson.course?.name || "Unknown course"}</p>
                    {lesson.description && (
                      <p className="text-sm text-slate-700 mt-2">{lesson.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigate(`/teacher/lessons/edit/${lesson._id}`)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(lesson._id)} className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {lesson.materialUrl ? (
                    <a href={toPublicMediaUrl(lesson.materialUrl)} target="_blank" rel="noopener noreferrer" download className="text-sm font-semibold text-[#207D86] hover:text-[#14555B]">Download Material</a>
                  ) : (
                    <span className="text-sm text-slate-500">No document uploaded</span>
                  )}

                  {lesson.videoUrl ? (
                    <a href={toPublicMediaUrl(lesson.videoUrl)} target="_blank" rel="noopener noreferrer" download className="text-sm font-semibold text-[#207D86] hover:text-[#14555B]">Download Video</a>
                  ) : (
                    <span className="text-sm text-slate-500">No video uploaded</span>
                  )}
                </div>

                {lesson.videoUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-700 mb-2">Watch online</p>
                    <video controls className="w-full max-h-72 rounded-lg border border-slate-300 bg-black" src={toPublicMediaUrl(lesson.videoUrl)} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LessonsManage;
