import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import lessonService from "../../../services/LessonService";

// --- Logic remains untouched ---
const toPublicMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
  const apiBase =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const origin = apiBase.replace(/\/api\/v1\/?$/i, "");
  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
};

const inferFileNameFromUrl = (url) => {
  if (!url) return "";
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || "";
    return decodeURIComponent(lastSegment).trim();
  } catch {
    return "";
  }
};

const downloadFile = async (url, fileName = "") => {
  if (!url) return;
  if (/^blob:/i.test(url)) {
    const blobLink = document.createElement("a");
    blobLink.href = url;
    blobLink.download = fileName || "material";
    document.body.appendChild(blobLink);
    blobLink.click();
    document.body.removeChild(blobLink);
    return;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to download file");
  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName || inferFileNameFromUrl(url) || "material";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const getTeacherZoomUrl = (lesson) =>
  lesson?.onlineMeeting?.startUrl ||
  lesson?.onlineMeeting?.start_url ||
  lesson?.zoomStartUrl ||
  lesson?.onlineMeeting?.joinUrl ||
  "";

const getZoomStartTime = (lesson) =>
  lesson?.onlineMeeting?.startTime ||
  lesson?.onlineMeeting?.start_time ||
  lesson?.zoomStartTime ||
  "";

const LessonsManage = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModules, setOpenModules] = useState({});
  const [gradeFilter, setGradeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleVideos, setVisibleVideos] = useState({});

  const loadLessons = async (opts = {}) => {
    try {
      setError("");
      setIsLoading(true);
      const params = {
        q: opts.q !== undefined ? opts.q : searchQuery,
        grade: opts.grade !== undefined ? opts.grade : gradeFilter,
      };
      const lessonData = await lessonService.getAllLessons(params);
      setLessons(Array.isArray(lessonData) ? lessonData : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    loadLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search/grade filter
  useEffect(() => {
    const t = setTimeout(() => {
      loadLessons();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, gradeFilter]);

  const handleDelete = async (lessonId) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this lesson?",
    );
    if (!shouldDelete) return;
    try {
      setError("");
      await lessonService.deleteLesson(lessonId);
      await loadLessons();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete lesson");
    }
  };

  const handleMaterialDownload = async (lesson) => {
    if (!lesson?.materialUrl) return;
    const fallbackUrl = toPublicMediaUrl(lesson.materialUrl);
    const isRemoteAsset = /^https?:\/\//i.test(fallbackUrl);
    if (!lesson._id) {
      await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
      return;
    }
    try {
      const { downloadUrl: signedUrl, fileName } =
        await lessonService.getMaterialDownloadUrl(lesson._id);
      await downloadFile(
        signedUrl || fallbackUrl,
        fileName || inferFileNameFromUrl(signedUrl || fallbackUrl),
      );
    } catch {
      if (!isRemoteAsset || /^blob:/i.test(fallbackUrl)) {
        await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
        return;
      }
      setError("Failed to generate secure material link.");
    }
  };

  return (
    <section className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
            Manage Lessons
          </h2>
          <p className="text-slate-500 mt-2 text-lg">
            Organize, edit, and maintain your curriculum.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Filter by Grade
          </label>
          <input
            type="search"
            placeholder="Search module or lesson"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#207D86] focus:border-transparent outline-none transition-all shadow-sm"
          />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full sm:w-48 bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#207D86] focus:border-transparent outline-none transition-all shadow-sm"
          >
            <option value="">All Grades</option>
            {(() => {
              const gradeMap = new Map();
              let hasUnassigned = false;
              lessons.forEach((l) => {
                if (!l.module) return;
                const g = l.module.grade;
                if (g && g._id) gradeMap.set(g._id, g.name || "Unnamed grade");
                if (!g) hasUnassigned = true;
              });
              const opts = Array.from(gradeMap.entries()).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ));
              if (hasUnassigned)
                opts.push(
                  <option key="__unassigned" value="__unassigned">
                    Unassigned
                  </option>,
                );
              return opts;
            })()}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#207D86] rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">
            Loading your curriculum...
          </p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 text-lg">
            No lessons found. Start by creating a new lesson.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {Object.values(
            lessons
              .filter((lesson) => {
                if (!lesson.module?._id) return false;
                if (!gradeFilter) return true;
                if (gradeFilter === "__unassigned") return !lesson.module.grade;
                return lesson.module.grade?._id === gradeFilter;
              })
              .reduce((acc, lesson) => {
                const moduleId = lesson.module?._id || "_unassigned";
                if (!acc[moduleId]) {
                  acc[moduleId] = {
                    module: lesson.module || {
                      name: "Unassigned",
                      _id: moduleId,
                    },
                    lessons: [],
                  };
                }
                acc[moduleId].lessons.push(lesson);
                return acc;
              }, {}),
          ).map((group) => (
            <div
              key={group.module._id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenModules((s) => ({
                    ...s,
                    [group.module._id]: !s[group.module._id],
                  }))
                }
                className={`w-full flex items-center justify-between px-6 py-5 text-left transition-colors ${openModules[group.module._id] ? "bg-slate-50" : "bg-white"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#0E2A47] text-white p-2 rounded-lg">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0E2A47] text-lg leading-tight">
                      {group.module.name || "Unassigned Module"}
                    </h3>
                    {group.module.grade?.name && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase tracking-wide">
                        {`Grade ${group.module.grade.name}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden sm:block text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {group.lessons.length}{" "}
                    {group.lessons.length === 1 ? "Lesson" : "Lessons"}
                  </span>
                  <span
                    className={`text-slate-400 transition-transform duration-300 ${openModules[group.module._id] ? "rotate-180" : ""}`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>
              </button>

              {openModules[group.module._id] && (
                <div className="p-6 bg-white grid gap-4 border-t border-slate-100">
                  {group.lessons.map((lesson) => (
                    <article
                      key={lesson._id}
                      className="group relative border border-slate-200 rounded-xl p-5 hover:border-[#207D86] hover:bg-slate-50/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#0E2A47] text-lg">
                              {lesson.title}
                            </h4>
                            {lesson.videoUrl && (
                              <span className="bg-green-100 text-green-700 text-[10px] font-black px-1.5 py-0.5 rounded tracking-tighter uppercase">
                                Video
                              </span>
                            )}
                            {lesson.materialUrl && (
                              <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-1.5 py-0.5 rounded tracking-tighter uppercase">
                                PDF
                              </span>
                            )}
                          </div>
                          {lesson.description && (
                            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                              {lesson.description}
                            </p>
                          )}

                          <div className="pt-2 flex flex-wrap gap-6 items-center">
                            {/* Download Material Link */}
                            {lesson.materialUrl && (
                              <button
                                onClick={() => handleMaterialDownload(lesson)}
                                className="flex items-center gap-2 text-sm font-bold text-[#207D86] hover:text-[#14555B] transition-colors group"
                              >
                                <div className="p-1.5 bg-[#207D86]/10 rounded-lg group-hover:bg-[#207D86]/20 transition-colors">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                <span>Download Material</span>
                              </button>
                            )}

                            {/* Download Video Link */}
                            {lesson.videoUrl && (
                              <a
                                href={toPublicMediaUrl(lesson.videoUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="flex items-center gap-2 text-sm font-bold text-[#207D86] hover:text-[#14555B] transition-colors group"
                              >
                                <div className="p-1.5 bg-[#207D86]/10 rounded-lg group-hover:bg-[#207D86]/20 transition-colors">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                <span>Download Video</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start">
                          <button
                            onClick={() =>
                              navigate(`/teacher/lessons/edit/${lesson._id}`)
                            }
                            className="p-2 text-slate-600 hover:text-[#207D86] hover:bg-[#207D86]/10 rounded-lg transition-colors border border-slate-200 shadow-sm"
                            title="Edit"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(lesson._id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 shadow-sm"
                            title="Delete"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Zoom Card */}
                      {getTeacherZoomUrl(lesson) && (
                        <div className="mt-5 rounded-xl border-l-4 border-l-[#207D86] bg-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div>
                            <p className="text-sm font-bold text-[#0E2A47]">
                              Live Zoom Session
                            </p>
                            {getZoomStartTime(lesson) && (
                              <p className="text-xs text-slate-600 mt-0.5">
                                Scheduled for{" "}
                                {formatDateTime(getZoomStartTime(lesson))}
                              </p>
                            )}
                          </div>
                          <a
                            href={getTeacherZoomUrl(lesson)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto text-center px-4 py-2 bg-[#207D86] text-white text-sm font-bold rounded-lg hover:bg-[#14555B] transition-colors shadow-sm"
                          >
                            Start Meeting
                          </a>
                        </div>
                      )}

                      {/* Video Player */}
                      {lesson.videoUrl && (
                        <div className="mt-5">
                          {!visibleVideos[lesson._id] ? (
                            <button
                              type="button"
                              onClick={() =>
                                setVisibleVideos((s) => ({
                                  ...s,
                                  [lesson._id]: true,
                                }))
                              }
                              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-100 hover:bg-[#207D86]/10 border border-slate-200 rounded-xl group transition-all"
                            >
                              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <svg
                                  className="w-5 h-5 text-[#207D86] fill-current"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-[#0E2A47]">
                                  Watch Online Lesson Video
                                </p>
                                <p className="text-xs text-slate-500">
                                  Click to watch the uploaded recording
                                </p>
                              </div>
                            </button>
                          ) : (
                            <div className="space-y-3 bg-black rounded-xl overflow-hidden shadow-2xl">
                              <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
                                <span className="text-white text-xs font-medium">
                                  Video Preview
                                </span>
                                <button
                                  onClick={() =>
                                    setVisibleVideos((s) => ({
                                      ...s,
                                      [lesson._id]: false,
                                    }))
                                  }
                                  className="text-slate-400 hover:text-white text-xs"
                                >
                                  Close [x]
                                </button>
                              </div>
                              <video
                                controls
                                className="w-full max-h-[400px]"
                                src={toPublicMediaUrl(lesson.videoUrl)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default LessonsManage;
