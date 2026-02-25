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

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const getZoomStartUrl = (lesson) => {
  return (
    lesson?.onlineMeeting?.startUrl ||
    lesson?.onlineMeeting?.start_url ||
    lesson?.zoomStartUrl ||
    ""
  );
};

const getZoomJoinUrl = (lesson) => {
  return (
    lesson?.onlineMeeting?.joinUrl ||
    lesson?.onlineMeeting?.join_url ||
    lesson?.zoomJoinUrl ||
    ""
  );
};

const getTeacherZoomUrl = (lesson) => getZoomStartUrl(lesson) || getZoomJoinUrl(lesson);

const getZoomStartTime = (lesson) => {
  return (
    lesson?.onlineMeeting?.startTime ||
    lesson?.onlineMeeting?.start_time ||
    lesson?.zoomStartTime ||
    ""
  );
};

const LessonsManage = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModules, setOpenModules] = useState({});
  const [gradeFilter, setGradeFilter] = useState("");
  const [visibleVideos, setVisibleVideos] = useState({});
  const [visibleMaterials, setVisibleMaterials] = useState({});

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0E2A47]">Your Lessons</h3>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-700">Filter by grade:</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
            >
              <option value="">All grades</option>
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
                if (hasUnassigned) opts.push(
                  <option key="__unassigned" value="__unassigned">Unassigned</option>
                );
                return opts;
              })()}
            </select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-slate-600">Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <p className="text-slate-600">No lessons found. Add your first lesson.</p>
        ) : (
          <div className="space-y-4">
            {/* Group lessons by module */}
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
                  acc[moduleId] = { module: lesson.module || { name: "Unassigned", _id: moduleId }, lessons: [] };
                }
                acc[moduleId].lessons.push(lesson);
                return acc;
              }, {})
            ).map((group) => (
              <div key={group.module._id} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenModules((s) => ({ ...s, [group.module._id]: !s[group.module._id] }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100"
                >
                  <div>
                    <div className="font-semibold text-[#0E2A47]">
                      {group.module.name || "Unassigned"}
                      {group.module.grade?.name && (
                        <span className="ml-2 text-sm font-normal text-slate-600">({group.module.grade.name})</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">{group.lessons.length} lesson{group.lessons.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="text-slate-500">{openModules[group.module._id] ? "▾" : "▸"}</div>
                </button>

                {openModules[group.module._id] && (
                  <div className="p-4 bg-white space-y-3">
                    {group.lessons.map((lesson) => (
                      <article key={lesson._id} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-[#0E2A47]">{lesson.title}</h4>
                            {lesson.description && <p className="text-sm text-slate-700 mt-1">{lesson.description}</p>}
                          </div>

                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => navigate(`/teacher/lessons/edit/${lesson._id}`)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white">Edit</button>
                            <button type="button" onClick={() => handleDelete(lesson._id)} className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50">Delete</button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          {lesson.materialUrl ? (
                            <div>
                              {!visibleMaterials[lesson._id] ? (
                                <div className="flex items-center gap-3">
                                  <a href={toPublicMediaUrl(lesson.materialUrl)} target="_blank" rel="noopener noreferrer" download className="text-sm font-semibold text-[#207D86] hover:text-[#14555B]">Download Material</a>
                                  <button
                                    type="button"
                                    onClick={() => setVisibleMaterials((s) => ({ ...s, [lesson._id]: true }))}
                                    className="text-sm px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                  >
                                    Preview
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <a href={toPublicMediaUrl(lesson.materialUrl)} target="_blank" rel="noopener noreferrer" download className="text-sm font-semibold text-[#207D86] hover:text-[#14555B]">Download Material</a>
                                    <button
                                      type="button"
                                      onClick={() => setVisibleMaterials((s) => ({ ...s, [lesson._id]: false }))}
                                      className="text-sm text-slate-500"
                                    >
                                      Close
                                    </button>
                                  </div>
                                  {(() => {
                                    const url = toPublicMediaUrl(lesson.materialUrl);
                                    const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
                                    if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) {
                                      return <img src={url} alt="Material preview" className="w-full max-h-96 object-contain rounded-lg border border-slate-300" />;
                                    }
                                    if (ext === 'pdf') {
                                      return <iframe src={url} title="Material preview" className="w-full h-96 rounded-lg border border-slate-300" />;
                                    }
                                    return (
                                      <div className="text-sm text-slate-700">
                                        Preview not available for this file type. <a href={url} download className="text-[#207D86]">Download</a>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">No document uploaded</span>
                          )}

                          {lesson.videoUrl ? (
                            <a href={toPublicMediaUrl(lesson.videoUrl)} target="_blank" rel="noopener noreferrer" download className="text-sm font-semibold text-[#207D86] hover:text-[#14555B]">Download Video</a>
                          ) : (
                            <span className="text-sm text-slate-500">No video uploaded</span>
                          )}
                        </div>

                        {getTeacherZoomUrl(lesson) && (
                          <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                            <p className="text-sm font-semibold text-slate-800">Zoom Meeting</p>
                            {getZoomStartTime(lesson) && (
                              <p className="text-sm text-slate-700 mt-1">
                                Starts: {formatDateTime(getZoomStartTime(lesson))}
                              </p>
                            )}
                            <a
                              href={getTeacherZoomUrl(lesson)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex mt-2 text-sm font-semibold text-[#207D86] hover:text-[#14555B]"
                            >
                              Start Zoom Meeting
                            </a>
                          </div>
                        )}

                        {lesson.videoUrl && (
                          <div className="mt-3">
                            {!visibleVideos[lesson._id] ? (
                              <div>
                                <p className="text-sm text-slate-700 mb-2">Watch online</p>
                                <button
                                  type="button"
                                  onClick={() => setVisibleVideos((s) => ({ ...s, [lesson._id]: true }))}
                                  className="inline-block px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                                >
                                  Open Video
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm text-slate-700">Watch online</p>
                                  <button
                                    type="button"
                                    onClick={() => setVisibleVideos((s) => ({ ...s, [lesson._id]: false }))}
                                    className="text-sm text-slate-500"
                                  >
                                    Close
                                  </button>
                                </div>
                                <video controls className="w-full max-h-72 rounded-lg border border-slate-300 bg-black" src={toPublicMediaUrl(lesson.videoUrl)} />
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
      </div>
    </section>
  );
};

export default LessonsManage;
