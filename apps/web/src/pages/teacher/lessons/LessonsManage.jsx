import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Plus, 
    Search, 
    FilterX, 
    Edit2, 
    Trash2, 
    AlertCircle, 
    Loader2, 
    Download, 
    PlayCircle, 
    X, 
    FileText, 
    Video, 
    Calendar, 
    Video as VideoIcon,
    ChevronDown,
    ChevronUp,
    Library
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import lessonService from "../../../services/LessonService";

const MySwal = withReactContent(Swal);

// --- Helper Logic ---
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

// --- Main Component ---
const LessonsManage = () => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [openModules, setOpenModules] = useState({});
    const [gradeFilter, setGradeFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleVideos, setVisibleVideos] = useState({});
    const [downloadingId, setDownloadingId] = useState(null);

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
            
            // Auto-open all modules by default on load
            if (Array.isArray(lessonData)) {
                const initialOpenState = {};
                lessonData.forEach((l) => {
                    const modId = l.module?._id || "_unassigned";
                    initialOpenState[modId] = true;
                });
                setOpenModules(initialOpenState);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load lessons.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
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
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this! This action will delete the lesson permanently.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#94a3b8",
            confirmButtonText: "Yes, delete it!",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all",
                cancelButton: "px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
            }
        });

        if (!result.isConfirmed) return;

        try {
            setError("");
            await lessonService.deleteLesson(lessonId);
            await loadLessons();
            MySwal.fire({
                title: "Deleted!",
                text: "The lesson has been removed.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete lesson.");
        }
    };

    const handleMaterialDownload = async (lesson) => {
        if (!lesson?.materialUrl) return;
        setDownloadingId(lesson._id);
        const fallbackUrl = toPublicMediaUrl(lesson.materialUrl);
        const isRemoteAsset = /^https?:\/\//i.test(fallbackUrl);
        
        if (!lesson._id) {
            await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
            setDownloadingId(null);
            return;
        }
        
        try {
            const { downloadUrl: signedUrl, fileName } = await lessonService.getMaterialDownloadUrl(lesson._id);
            await downloadFile(
                signedUrl || fallbackUrl,
                fileName || inferFileNameFromUrl(signedUrl || fallbackUrl),
            );
        } catch {
            if (!isRemoteAsset || /^blob:/i.test(fallbackUrl)) {
                await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
            } else {
                setError("Failed to generate secure material link.");
            }
        } finally {
            setDownloadingId(null);
        }
    };

    // Extract dynamic grade options natively instead of inline JSX
    const gradeOptions = useMemo(() => {
        const map = new Map();
        let hasUnassigned = false;
        lessons.forEach((l) => {
            if (!l.module) return;
            const g = l.module.grade;
            if (g && g._id) map.set(g._id, g.name || "Unnamed grade");
            if (!g) hasUnassigned = true;
        });
        return { map: Array.from(map.entries()), hasUnassigned };
    }, [lessons]);

    // Group lessons by module
    const groupedLessons = useMemo(() => {
        return Object.values(
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
                            module: lesson.module || { name: "Unassigned", _id: moduleId },
                            lessons: [],
                        };
                    }
                    acc[moduleId].lessons.push(lesson);
                    return acc;
                }, {})
        );
    }, [lessons, gradeFilter]);

    return (
        <section className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">Manage Lessons</h2>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        Organize, edit, and maintain your curriculum content.
                    </p>
                </div>

                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate("/teacher/lessons/add")}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98] w-full md:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Add Lesson
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-6 flex flex-col lg:flex-row gap-4 items-center relative z-10">
                {/* Search Input */}
                <div className="relative w-full lg:max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search modules or lessons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="flex w-full lg:w-auto gap-3 flex-col sm:flex-row">
                    <select
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="w-full sm:w-56 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                    >
                        <option value="">All Grades</option>
                        {gradeOptions.map.map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                        {gradeOptions.hasUnassigned && (
                            <option value="__unassigned">Unassigned</option>
                        )}
                    </select>

                    {(searchQuery || gradeFilter) && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(""); setGradeFilter(""); }}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shrink-0"
                            title="Clear all filters"
                        >
                            <FilterX className="w-4 h-4" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
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
                    <p className="text-slate-500 font-medium animate-pulse">Loading curriculum data...</p>
                </div>
            ) : groupedLessons.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                        <Library className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-700 mb-2">No lessons found</h4>
                    <p className="text-slate-500 max-w-md">
                        {(searchQuery || gradeFilter)
                            ? "We couldn't find any lessons matching your filters. Try adjusting your search."
                            : "Start building your curriculum by adding your first lesson."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {groupedLessons.map((group) => (
                        <div key={group.module._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                            {/* Accordion Header */}
                            <button
                                type="button"
                                onClick={() => setOpenModules((s) => ({ ...s, [group.module._id]: !s[group.module._id] }))}
                                className={`w-full flex items-center justify-between px-6 py-5 text-left transition-colors focus:outline-none focus:bg-slate-50 hover:bg-slate-50 ${openModules[group.module._id] ? "bg-slate-50/80 border-b border-slate-100" : "bg-white"}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl transition-colors ${openModules[group.module._id] ? "bg-[#207D86] text-white shadow-md shadow-[#207D86]/20" : "bg-slate-100 text-slate-500"}`}>
                                        <Library className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-[#0E2A47] text-lg leading-tight">
                                            {group.module.name || "Unassigned Module"}
                                        </h3>
                                        {group.module.grade?.name && (
                                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">
                                                {`Grade ${group.module.grade.name}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="hidden sm:inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-full shadow-sm">
                                        {group.lessons.length} {group.lessons.length === 1 ? "Lesson" : "Lessons"}
                                    </span>
                                    <span className={`text-slate-400 transition-transform duration-300 ${openModules[group.module._id] ? "rotate-180" : ""}`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </span>
                                </div>
                            </button>

                            {/* Accordion Content (Lessons List) */}
                            {openModules[group.module._id] && (
                                <div className="p-6 bg-slate-50/30 grid gap-4">
                                    {group.lessons.map((lesson) => (
                                        <article
                                            key={lesson._id}
                                            className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-[#207D86]/40 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                <div className="flex-1 space-y-3">
                                                    
                                                    {/* Title & Badges */}
                                                    <div className="flex flex-wrap items-center gap-2.5">
                                                        <h4 className="font-extrabold text-slate-800 text-lg group-hover:text-[#207D86] transition-colors">
                                                            {lesson.title}
                                                        </h4>
                                                        <div className="flex gap-1.5">
                                                            {lesson.videoUrl && (
                                                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                                                                    <Video className="w-3 h-3" /> Video
                                                                </span>
                                                            )}
                                                            {lesson.materialUrl && (
                                                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                                                                    <FileText className="w-3 h-3" /> PDF
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    {lesson.description && (
                                                        <p className="text-slate-500 text-sm leading-relaxed max-w-3xl">
                                                            {lesson.description}
                                                        </p>
                                                    )}

                                                    {/* Resource Links */}
                                                    <div className="pt-2 flex flex-wrap gap-4 items-center">
                                                        {lesson.materialUrl && (
                                                            <button
                                                                onClick={() => handleMaterialDownload(lesson)}
                                                                disabled={downloadingId === lesson._id}
                                                                className="inline-flex items-center gap-2 text-sm font-bold text-[#207D86] hover:text-[#18646b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                <div className="p-1.5 bg-[#207D86]/10 rounded-lg">
                                                                    {downloadingId === lesson._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                                                </div>
                                                                {downloadingId === lesson._id ? "Downloading..." : "Download Material"}
                                                            </button>
                                                        )}

                                                        {lesson.videoUrl && (
                                                            <a
                                                                href={toPublicMediaUrl(lesson.videoUrl)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download
                                                                className="inline-flex items-center gap-2 text-sm font-bold text-[#207D86] hover:text-[#18646b] transition-colors"
                                                            >
                                                                <div className="p-1.5 bg-[#207D86]/10 rounded-lg">
                                                                    <Download className="w-4 h-4" />
                                                                </div>
                                                                Download Video
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 self-start pt-2 md:pt-0 border-t border-slate-100 md:border-none w-full md:w-auto">
                                                    <button
                                                        onClick={() => navigate(`/teacher/lessons/edit/${lesson._id}`)}
                                                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        <span className="md:hidden">Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(lesson._id)}
                                                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        <span className="md:hidden">Delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Zoom Card */}
                                            {getTeacherZoomUrl(lesson) && (
                                                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                    <div>
                                                        <p className="text-sm font-extrabold text-indigo-900 flex items-center gap-2">
                                                            <VideoIcon className="w-4 h-4" /> Live Zoom Session
                                                        </p>
                                                        {getZoomStartTime(lesson) && (
                                                            <p className="text-xs font-medium text-indigo-700/70 mt-1 flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                Scheduled for {formatDateTime(getZoomStartTime(lesson))}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={getTeacherZoomUrl(lesson)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-[#207D86] text-white text-sm font-bold rounded-xl hover:bg-[#18646b] transition-all shadow-md shadow-[#207D86]/20 active:scale-[0.98]"
                                                    >
                                                        <PlayCircle className="w-4 h-4" />
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
                                                            onClick={() => setVisibleVideos((s) => ({ ...s, [lesson._id]: true }))}
                                                            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 hover:bg-[#207D86]/5 border border-slate-200 rounded-xl group transition-all"
                                                        >
                                                            <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 group-hover:scale-110 group-hover:border-[#207D86]/30 transition-transform">
                                                                <PlayCircle className="w-5 h-5 text-[#207D86]" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    Watch Lesson Video
                                                                </p>
                                                                <p className="text-xs font-medium text-slate-500">
                                                                    Click to play the uploaded recording
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="space-y-3 bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700">
                                                                <span className="text-slate-200 text-xs font-bold flex items-center gap-2">
                                                                    <VideoIcon className="w-4 h-4" /> Video Preview
                                                                </span>
                                                                <button
                                                                    onClick={() => setVisibleVideos((s) => ({ ...s, [lesson._id]: false }))}
                                                                    className="text-slate-400 hover:text-white transition-colors p-1"
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