import { useEffect, useMemo, useState } from "react";
import moduleService from "../../services/ModuleService";
import lessonService from "../../services/LessonService";

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

const triggerBrowserDownload = (url, fileName = "") => {
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  if (fileName) {
    link.download = fileName;
  }
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadFile = async (url, fileName = "", forceBlobDownload = false) => {
  if (!url) return;
  if (/^blob:/i.test(url)) {
    triggerBrowserDownload(url, fileName || "resource");
    return;
  }
  if (forceBlobDownload) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to download file");
    const fileBlob = await response.blob();
    const objectUrl = URL.createObjectURL(fileBlob);
    try {
      triggerBrowserDownload(
        objectUrl,
        fileName || inferFileNameFromUrl(url) || "resource",
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    return;
  }
  triggerBrowserDownload(url, fileName || inferFileNameFromUrl(url) || "resource");
};

const StudentModules = () => {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleVideos, setVisibleVideos] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadModules = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [moduleData, lessonData] = await Promise.all([
          moduleService.getAllModules(),
          lessonService.getAllLessons({ q: searchQuery }),
        ]);
        if (isMounted) {
          setModules(Array.isArray(moduleData) ? moduleData : []);
          setLessons(Array.isArray(lessonData) ? lessonData : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Failed to load modules");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadModules();

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced lesson search
  useEffect(() => {
    let isMounted = true;
    const t = setTimeout(async () => {
      try {
        const lessonData = await lessonService.getAllLessons({ q: searchQuery });
        if (isMounted) setLessons(Array.isArray(lessonData) ? lessonData : []);
      } catch (err) {
        if (isMounted) setError(err?.response?.data?.message || "Failed to load lessons");
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(t);
    };
  }, [searchQuery]);

  const hasModules = useMemo(() => modules.length > 0, [modules]);
  const lessonsByModule = useMemo(() => {
    return lessons.reduce((acc, lesson) => {
      const moduleId = lesson?.module?._id || lesson?.module;
      if (!moduleId) return acc;

      const key = String(moduleId);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(lesson);
      return acc;
    }, {});
  }, [lessons]);

  const displayedModules = useMemo(() => {
    if (!searchQuery || String(searchQuery).trim() === "") return modules;
    const q = String(searchQuery).trim();
    const re = new RegExp(q, "i");

    // modules that have matching lessons
    const moduleIdsFromLessons = new Set(
      lessons.map((l) => String(l?.module?._id || l?.module)).filter(Boolean),
    );

    return modules.filter((m) => {
      if (!m) return false;
      if (moduleIdsFromLessons.has(String(m._id))) return true;
      if (re.test(m.name || "")) return true;
      if (m.grade && (m.grade.name && re.test(m.grade.name))) return true;
      return false;
    });
  }, [modules, lessons, searchQuery]);

  const handleMaterialDownload = async (lesson) => {
    if (!lesson?.materialUrl) return;
    const fallbackUrl = toPublicMediaUrl(lesson.materialUrl);
    if (!lesson._id) {
      await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl), true);
      return;
    }
    try {
      const { downloadUrl: signedUrl, fileName } =
        await lessonService.getMaterialDownloadUrl(lesson._id);
      await downloadFile(
        signedUrl || fallbackUrl,
        fileName || inferFileNameFromUrl(signedUrl || fallbackUrl),
        true,
      );
    } catch {
      setError("Failed to download lesson material");
    }
  };

  const handleVideoDownload = async (lesson) => {
    if (!lesson?.videoUrl) return;
    const fallbackUrl = toPublicMediaUrl(lesson.videoUrl);
    if (!lesson._id) {
      await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
      return;
    }
    try {
      const { downloadUrl: signedUrl, fileName } =
        await lessonService.getVideoDownloadUrl(lesson._id);
      const resolvedVideoUrl = toPublicMediaUrl(signedUrl || fallbackUrl);
      await downloadFile(
        resolvedVideoUrl,
        fileName || inferFileNameFromUrl(resolvedVideoUrl),
      );
    } catch {
      setError("Failed to download lesson video");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Modules</h2>
        <p className="text-sm text-slate-600 mt-1">
          Modules available for your assigned grade.
        </p>
      </div>

      <div>
        <input
          type="search"
          placeholder="Search modules or lessons"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-96 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#207D86] focus:border-transparent outline-none"
        />
      </div>

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading modules...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && !hasModules && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No modules are available for your grade yet.
        </div>
      )}

      {!isLoading && !error && hasModules && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedModules.map((module) => (
            <article
              key={module._id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{module.name}</h3>
              {module.description ? (
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">{module.description}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No description available.</p>
              )}

              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <p>
                  <span className="font-medium text-slate-700">Grade:</span>{" "}
                  {module?.grade?.name || "N/A"}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Level:</span>{" "}
                  {module?.level?.name || "N/A"}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-900">Lessons</h4>

                {(lessonsByModule[String(module._id)] || []).length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No lessons available yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {(lessonsByModule[String(module._id)] || []).map((lesson) => (
                      <div key={lesson._id} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-sm font-medium text-slate-800">{lesson.title}</p>
                        {lesson.description ? (
                          <p className="mt-1 text-xs text-slate-600">{lesson.description}</p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap gap-2">
                          {lesson.materialUrl ? (
                            <button
                              type="button"
                              onClick={() => handleMaterialDownload(lesson)}
                              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Material
                            </button>
                          ) : null}

                          {lesson.videoUrl ? (
                            <button
                              type="button"
                              onClick={() => handleVideoDownload(lesson)}
                              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Video
                            </button>
                          ) : null}

                          {lesson.videoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setVisibleVideos((s) => ({
                                  ...s,
                                  [lesson._id]: !s[lesson._id],
                                }))
                              }
                              className="rounded-md border border-[#207D86] bg-[#207D86]/10 px-2.5 py-1 text-xs font-medium text-[#207D86] hover:bg-[#207D86]/20"
                            >
                              {visibleVideos[lesson._id] ? "Hide Video" : "Watch Video"}
                            </button>
                          ) : null}

                          {lesson?.onlineMeeting?.joinUrl ? (
                            <a
                              href={lesson.onlineMeeting.joinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Zoom Link
                            </a>
                          ) : null}
                        </div>
                        {/* Teacher & Zoom meta */}
                        <div className="mt-2 text-xs text-slate-500">
                          {lesson.createdBy ? (
                            <span className="block">By: {lesson.createdBy.firstName} {lesson.createdBy.lastName}</span>
                          ) : null}

                          {lesson.school === null ? (
                            <span className="block">Independent Teacher</span>
                          ) : null}
                        </div>

                        {lesson.videoUrl && visibleVideos[lesson._id] ? (
                          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between bg-slate-900 px-3 py-2">
                              <span className="text-[11px] font-medium text-white">Video Preview</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setVisibleVideos((s) => ({
                                    ...s,
                                    [lesson._id]: false,
                                  }))
                                }
                                className="text-[11px] text-slate-300 hover:text-white"
                              >
                                Close [x]
                              </button>
                            </div>
                            <video
                              controls
                              className="w-full max-h-72 bg-black"
                              src={toPublicMediaUrl(lesson.videoUrl)}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default StudentModules;
