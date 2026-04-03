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
    Download, 
    PlayCircle, 
    Video as VideoIcon, 
    X,
    User,
    Shield,
    ChevronLeft,
    ChevronRight,
    Calendar
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import moduleService from "../../services/ModuleService";
import lessonService from "../../services/LessonService";

// --- Helpers (Unchanged) ---
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
    if (fileName) link.download = fileName;
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
            triggerBrowserDownload(objectUrl, fileName || inferFileNameFromUrl(url) || "resource");
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
        return;
    }
    triggerBrowserDownload(url, fileName || inferFileNameFromUrl(url) || "resource");
};

// --- Main Component ---
const StudentModules = () => {
    const { user } = useAuth();
    const [modules, setModules] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    
    // UI State
    const [selectedModule, setSelectedModule] = useState(null); // Controls Master/Detail view
    const [visibleVideos, setVisibleVideos] = useState({});
    const [downloadingId, setDownloadingId] = useState(null);

    // Fetch initial data
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
                if (isMounted) setError(err?.response?.data?.message || "Failed to load modules. Please refresh the page.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadModules();
        return () => { isMounted = false; };
    }, []);

    // Debounced search
    useEffect(() => {
        let isMounted = true;
        const t = setTimeout(async () => {
            try {
                const lessonData = await lessonService.getAllLessons({ q: searchQuery });
                if (isMounted) {
                    setLessons(Array.isArray(lessonData) ? lessonData : []);
                    // Optional: Reset to grid view if they search while in a module
                    if (searchQuery.trim() !== "") setSelectedModule(null);
                }
            } catch (err) {
                if (isMounted) setError("Failed to search lessons.");
            }
        }, 300);
        return () => { isMounted = false; clearTimeout(t); };
    }, [searchQuery]);

    const hasModules = useMemo(() => modules.length > 0, [modules]);
    
    const lessonsByModule = useMemo(() => {
        return lessons.reduce((acc, lesson) => {
            const moduleId = lesson?.module?._id || lesson?.module;
            if (!moduleId) return acc;
            const key = String(moduleId);
            if (!acc[key]) acc[key] = [];
            acc[key].push(lesson);
            return acc;
        }, {});
    }, [lessons]);

    const displayedModules = useMemo(() => {
        let filtered = modules;

        // Filter by stream if student is in advanced level
        const isAdvancedLevel = user?.level && 
            (String(user.level.name || "").toLowerCase().includes("advanced") || 
             String(user.level.name || "").toLowerCase().includes("a/l"));
        
        if (isAdvancedLevel && user?.stream) {
            filtered = filtered.filter(m => m.subjectStream === user.stream);
        }

        if (!searchQuery || String(searchQuery).trim() === "") return filtered;
        const q = String(searchQuery).trim();
        const re = new RegExp(q, "i");
        const moduleIdsFromLessons = new Set(
            lessons.map((l) => String(l?.module?._id || l?.module)).filter(Boolean),
        );
        return filtered.filter((m) => {
            if (!m) return false;
            if (moduleIdsFromLessons.has(String(m._id))) return true;
            if (re.test(m.name || "")) return true;
            if (m.grade && (m.grade.name && re.test(m.grade.name))) return true;
            return false;
        });
    }, [modules, lessons, searchQuery, user]);

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
            await downloadFile(signedUrl || fallbackUrl, fileName || inferFileNameFromUrl(signedUrl || fallbackUrl), true);
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
            await downloadFile(resolvedVideoUrl, fileName || inferFileNameFromUrl(resolvedVideoUrl));
        } catch {
            setError("Failed to download lesson video.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <section className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header & Search Area */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
                            {selectedModule ? "Module Details" : "My Learning Modules"}
                        </h2>
                        <p className="text-slate-500 mt-2 text-sm md:text-base">
                            {selectedModule 
                                ? `Viewing lessons for ${selectedModule.name}` 
                                : "Explore subjects, access materials, and watch lesson recordings."}
                        </p>
                    </div>

                    {/* Only show search on the main grid view */}
                    {!selectedModule && (
                        <div className="relative w-full md:max-w-md group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="search"
                                placeholder="Search subjects or specific lessons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {!isLoading && error && (
                <div className="mb-6 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
            )}

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
                        <Loader2 className="w-8 h-8 text-[#207D86] animate-spin" />
                    </div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading your curriculum...</p>
                </div>
            ) : selectedModule ? (
                /* ========================================================= */
                /* DETAIL VIEW: Specific Module & Its Lessons                */
                /* ========================================================= */
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    {/* Back Button & Module Info Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#207D86]"></div>
                        <button 
                            onClick={() => setSelectedModule(null)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#207D86] transition-colors mb-4"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back to Modules
                        </button>
                        <h3 className="text-2xl font-extrabold text-slate-800 mb-2">{selectedModule.name}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> {selectedModule?.grade?.name || "N/A"}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
                                <Layers className="w-3.5 h-3.5 text-slate-400" /> {selectedModule?.level?.name || "N/A"}
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                            {selectedModule.description || "No specific description provided for this module."}
                        </p>
                    </div>

                    {/* Lesson List */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                            <BookOpen className="w-5 h-5 text-[#207D86]" /> Assigned Lessons
                        </h4>

                        {(lessonsByModule[String(selectedModule._id)] || []).length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white">
                                <p className="text-slate-500">No lessons have been uploaded to this module yet.</p>
                            </div>
                        ) : (
                            (lessonsByModule[String(selectedModule._id)] || []).map((lesson, index) => (
                                <div key={lesson._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-[#207D86]/30 transition-all">
                                    <div className="p-5 sm:p-6 md:flex gap-6 justify-between items-start">
                                        
                                        {/* Lesson Info */}
                                        <div className="flex-1 mb-4 md:mb-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="bg-[#207D86]/10 text-[#207D86] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                    Lesson {index + 1}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Updated recently
                                                </span>
                                            </div>
                                            <h5 className="text-lg font-bold text-slate-800">{lesson.title}</h5>
                                            {lesson.description && (
                                                <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-3xl">
                                                    {lesson.description}
                                                </p>
                                            )}
                                            
                                            {/* Meta Tags */}
                                            <div className="flex flex-wrap gap-3 mt-4">
                                                {lesson.createdBy && (
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        {lesson.createdBy.firstName} {lesson.createdBy.lastName}
                                                    </span>
                                                )}
                                                {lesson.school === null && (
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                                                        <Shield className="w-3.5 h-3.5" /> Independent Resource
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 md:w-48">
                                            {lesson.onlineMeeting?.joinUrl && (
                                                <a
                                                    href={lesson.onlineMeeting.joinUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                                >
                                                    <PlayCircle className="w-4 h-4" /> Join Live Class
                                                </a>
                                            )}

                                            {lesson.videoUrl && (
                                                <button
                                                    onClick={() => setVisibleVideos((s) => ({ ...s, [lesson._id]: !s[lesson._id] }))}
                                                    className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors ${
                                                        visibleVideos[lesson._id] 
                                                            ? "bg-slate-100 text-slate-700 border-slate-200" 
                                                            : "bg-white text-[#207D86] border-[#207D86]/30 hover:bg-[#207D86]/5"
                                                    }`}
                                                >
                                                    <VideoIcon className="w-4 h-4" /> 
                                                    {visibleVideos[lesson._id] ? "Close Video" : "Watch Recording"}
                                                </button>
                                            )}

                                            <div className="flex gap-2 w-full">
                                                {lesson.materialUrl && (
                                                    <button
                                                        onClick={() => handleMaterialDownload(lesson)}
                                                        disabled={downloadingId === `material-${lesson._id}`}
                                                        className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                                                    >
                                                        {downloadingId === `material-${lesson._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                                        Notes
                                                    </button>
                                                )}
                                                {lesson.videoUrl && (
                                                    <button
                                                        onClick={() => handleVideoDownload(lesson)}
                                                        disabled={downloadingId === `video-${lesson._id}`}
                                                        className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                                                    >
                                                        {downloadingId === `video-${lesson._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                        Video
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Video Player Drawer */}
                                    {lesson.videoUrl && visibleVideos[lesson._id] && (
                                        <div className="border-t border-slate-100 bg-slate-900 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                                                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                                    Now Playing: {lesson.title}
                                                </span>
                                                <button
                                                    onClick={() => setVisibleVideos((s) => ({ ...s, [lesson._id]: false }))}
                                                    className="text-slate-400 hover:text-white transition-colors p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="relative pt-[56.25%] w-full bg-black">
                                                <video
                                                    controls
                                                    className="absolute top-0 left-0 w-full h-full"
                                                    src={toPublicMediaUrl(lesson.videoUrl)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : !hasModules ? (
                /* Empty States */
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                        <Library className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-700 mb-2">No modules available</h4>
                    <p className="text-slate-500 max-w-md">
                        It looks like there are no learning modules assigned to your current grade level yet.
                    </p>
                </div>
            ) : displayedModules.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-700 mb-2">No matches found</h4>
                    <p className="text-slate-500 max-w-md">
                        We couldn't find any modules matching "{searchQuery}".
                    </p>
                    <button 
                        onClick={() => setSearchQuery("")}
                        className="mt-4 text-sm font-semibold text-[#207D86] hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                /* ========================================================= */
                /* MASTER VIEW: Clean Grid of Modules                        */
                /* ========================================================= */
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {displayedModules.map((module) => {
                        const moduleLessons = lessonsByModule[String(module._id)] || [];
                        
                        return (
                            <button
                                key={module._id}
                                onClick={() => setSelectedModule(module)}
                                className="group flex flex-col text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#207D86]/40 transition-all duration-300 overflow-hidden"
                            >
                                <div className="p-6 flex-1">
                                    <div className="w-12 h-12 bg-[#207D86]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Library className="w-6 h-6 text-[#207D86]" />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-[#0E2A47] mb-2 line-clamp-2">
                                        {module.name}
                                    </h3>
                                    
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {module?.grade?.name || "No Grade"}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {module?.level?.name || "No Level"}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                        {module.description || "Click to view curriculum details and lessons."}
                                    </p>
                                </div>
                                
                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between w-full group-hover:bg-[#207D86]/5 transition-colors">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                        <BookOpen className="w-4 h-4 text-[#207D86]" />
                                        {moduleLessons.length} {moduleLessons.length === 1 ? 'Lesson' : 'Lessons'}
                                    </div>
                                    <span className="flex items-center text-sm font-bold text-[#207D86] group-hover:translate-x-1 transition-transform">
                                        Enter <ChevronRight className="w-4 h-4 ml-1" />
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default StudentModules;