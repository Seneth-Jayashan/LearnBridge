import { useEffect, useMemo, useState } from "react";
import { 
    Search, 
    AlertCircle, 
    Loader2, 
    Library, 
    Layers, 
    GraduationCap, 
    BookOpen, 
    FileText, 
    Video as VideoIcon, 
    Download, 
    PlayCircle, 
    Video, 
    X,
    User,
    Shield
} from "lucide-react";
import moduleService from "../../services/ModuleService";
import lessonService from "../../services/LessonService";

// --- Helpers ---
const toPublicMediaUrl = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
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

// --- Main Component ---
const StudentModules = () => {
    const [modules, setModules] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [visibleVideos, setVisibleVideos] = useState({});
    
    // UI State for download spinners
    const [downloadingId, setDownloadingId] = useState(null);

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
                    setError(err?.response?.data?.message || "Failed to load modules. Please refresh the page.");
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
                if (isMounted) setError(err?.response?.data?.message || "Failed to search lessons.");
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
        setDownloadingId(`material-${lesson._id}`);
        const fallbackUrl = toPublicMediaUrl(lesson.materialUrl);
        if (!lesson._id) {
            await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl), true);
            setDownloadingId(null);
            return;
        }
        try {
            const { downloadUrl: signedUrl, fileName } = await lessonService.getMaterialDownloadUrl(lesson._id);
            await downloadFile(
                signedUrl || fallbackUrl,
                fileName || inferFileNameFromUrl(signedUrl || fallbackUrl),
                true,
            );
        } catch {
            setError("Failed to download lesson material.");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleVideoDownload = async (lesson) => {
        if (!lesson?.videoUrl) return;
        setDownloadingId(`video-${lesson._id}`);
        const fallbackUrl = toPublicMediaUrl(lesson.videoUrl);
        if (!lesson._id) {
            await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
            setDownloadingId(null);
            return;
        }
        try {
            const { downloadUrl: signedUrl, fileName } = await lessonService.getVideoDownloadUrl(lesson._id);
            const resolvedVideoUrl = toPublicMediaUrl(signedUrl || fallbackUrl);
            await downloadFile(
                resolvedVideoUrl,
                fileName || inferFileNameFromUrl(resolvedVideoUrl),
            );
        } catch {
            setError("Failed to download lesson video.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <section className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">My Learning Modules</h2>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        Explore subjects, access materials, and watch lesson recordings for your grade.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-6 relative z-10">
                <div className="relative w-full md:max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search subjects or specific lessons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all"
                    />
                </div>
            </div>

            {/* Error Banner */}
            {!isLoading && error && (
                <div className="mb-6 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
            )}

            {/* Main Content Area */}
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
                        <Loader2 className="w-8 h-8 text-[#207D86] animate-spin" />
                    </div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading your curriculum...</p>
                </div>
            ) : !hasModules ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                        <Library className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-700 mb-2">No modules available</h4>
                    <p className="text-slate-500 max-w-md">
                        It looks like there are no learning modules assigned to your current grade level yet. Please check back later.
                    </p>
                </div>
            ) : displayedModules.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-700 mb-2">No matches found</h4>
                    <p className="text-slate-500 max-w-md">
                        We couldn't find any modules or lessons matching "{searchQuery}". Try adjusting your search keywords.
                    </p>
                    <button 
                        onClick={() => setSearchQuery("")}
                        className="mt-4 text-sm font-semibold text-[#207D86] hover:text-[#18646b] hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
                    {displayedModules.map((module) => (
                        <article
                            key={module._id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#207D86]/30 transition-all duration-300 flex flex-col overflow-hidden"
                        >
                            {/* Module Header */}
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-xl font-extrabold text-[#0E2A47] line-clamp-1 mb-3" title={module.name}>
                                    {module.name}
                                </h3>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                        {module?.grade?.name || "N/A"}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                                        {module?.level?.name || "N/A"}
                                    </span>
                                </div>

                                {module.description ? (
                                    <p className="text-sm text-slate-500 line-clamp-2" title={module.description}>
                                        {module.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No description provided.</p>
                                )}
                            </div>

                            {/* Lessons List */}
                            <div className="p-5 bg-white flex-1">
                                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4">
                                    <BookOpen className="w-4 h-4 text-[#207D86]" /> 
                                    Assigned Lessons
                                </h4>

                                {(lessonsByModule[String(module._id)] || []).length === 0 ? (
                                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <p className="text-sm font-medium text-slate-500">No lessons available yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {(lessonsByModule[String(module._id)] || []).map((lesson) => (
                                            <div key={lesson._id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors shadow-sm">
                                                
                                                {/* Lesson Header */}
                                                <div className="mb-2">
                                                    <p className="text-base font-bold text-slate-800">{lesson.title}</p>
                                                    {lesson.description && (
                                                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{lesson.description}</p>
                                                    )}
                                                </div>

                                                {/* Meta Info */}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-slate-500 font-medium">
                                                    {lesson.createdBy && (
                                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                            <User className="w-3 h-3" />
                                                            {lesson.createdBy.firstName} {lesson.createdBy.lastName}
                                                        </span>
                                                    )}
                                                    {lesson.school === null && (
                                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                            <Shield className="w-3 h-3" />
                                                            Independent Resource
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions / Downloads */}
                                                <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                                                    
                                                    {lesson.materialUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMaterialDownload(lesson)}
                                                            disabled={downloadingId === `material-${lesson._id}`}
                                                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 disabled:cursor-wait"
                                                        >
                                                            {downloadingId === `material-${lesson._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                                            PDF / Doc
                                                        </button>
                                                    )}

                                                    {lesson.videoUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVideoDownload(lesson)}
                                                            disabled={downloadingId === `video-${lesson._id}`}
                                                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-60 disabled:cursor-wait"
                                                        >
                                                            {downloadingId === `video-${lesson._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                            Video
                                                        </button>
                                                    )}

                                                    {lesson.videoUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setVisibleVideos((s) => ({ ...s, [lesson._id]: !s[lesson._id] }))}
                                                            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 ${
                                                                visibleVideos[lesson._id] 
                                                                    ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200" 
                                                                    : "bg-[#207D86]/10 text-[#207D86] border border-[#207D86]/20 hover:bg-[#207D86]/20 focus:ring-[#207D86]/30"
                                                            }`}
                                                        >
                                                            <VideoIcon className="w-3.5 h-3.5" />
                                                            {visibleVideos[lesson._id] ? "Close Video" : "Watch"}
                                                        </button>
                                                    )}

                                                    {lesson?.onlineMeeting?.joinUrl && (
                                                        <a
                                                            href={lesson.onlineMeeting.joinUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200 shadow-sm"
                                                        >
                                                            <PlayCircle className="w-3.5 h-3.5" />
                                                            Join Live Zoom
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Expandable Video Player */}
                                                {lesson.videoUrl && visibleVideos[lesson._id] && (
                                                    <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2">
                                                        <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5">
                                                            <span className="text-xs font-bold text-white flex items-center gap-2">
                                                                <VideoIcon className="w-4 h-4" /> Video Preview
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setVisibleVideos((s) => ({ ...s, [lesson._id]: false }))}
                                                                className="text-slate-400 hover:text-white transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <video
                                                            controls
                                                            className="w-full max-h-[400px] bg-black"
                                                            src={toPublicMediaUrl(lesson.videoUrl)}
                                                        />
                                                    </div>
                                                )}
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