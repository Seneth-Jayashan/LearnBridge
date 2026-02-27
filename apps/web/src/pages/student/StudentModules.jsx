import { useEffect, useMemo, useState } from "react";
import moduleService from "../../services/ModuleService";
import lessonService from "../../services/LessonService";

const StudentModules = () => {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadModules = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [moduleData, lessonData] = await Promise.all([
          moduleService.getAllModules(),
          lessonService.getAllLessons(),
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

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Modules</h2>
        <p className="text-sm text-slate-600 mt-1">
          Modules available for your assigned grade.
        </p>
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
          {modules.map((module) => (
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
                            <a
                              href={lesson.materialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Material
                            </a>
                          ) : null}

                          {lesson.videoUrl ? (
                            <a
                              href={lesson.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Video
                            </a>
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
