import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
    Library, 
    Type, 
    AlignLeft, 
    Video, 
    FileText, 
    Calendar, 
    AlertCircle, 
    Loader2, 
    Save, 
    X, 
    Radio,
    Download,
    GitBranch,
    Search,
    Layers,
    GraduationCap
} from "lucide-react";
import lessonService from "../../../services/LessonService";
import moduleService from "../../../services/ModuleService";

const initialForm = {
    title: "",
    description: "",
    module: "",
    materialUrl: "",
    videoUrl: "",
    zoomStartTime: "",
    isLive: false,
};

const getGradeNumber = (gradeName) => {
    const match = String(gradeName || "").match(/\d+/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isNaN(parsed) ? null : parsed;
};

const isAdvancedModule = (moduleItem) => {
    const levelName = String(moduleItem?.level?.name || moduleItem?.level || "").toLowerCase();
    if (levelName.includes("advanced")) return true;
    const gradeName = moduleItem?.grade?.name || moduleItem?.grade;
    const gradeNumber = getGradeNumber(gradeName);
    return gradeNumber !== null && gradeNumber >= 12;
};

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
    if (!response.ok) {
        throw new Error("Failed to download file");
    }

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

const toDateTimeLocalValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};

const LessonsEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [formData, setFormData] = useState(initialForm);
    const [mediaFiles, setMediaFiles] = useState({ material: null, video: null });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState("");
    
    // Custom Module Dropdown State
    const [moduleQuery, setModuleQuery] = useState("");
    const [showModuleDropdown, setShowModuleDropdown] = useState(false);
    const moduleInputRef = useRef(null);

    const selectedModule = useMemo(() => {
        if (!formData.module) return null;
        return modules.find((m) => String(m._id) === String(formData.module)) || null;
    }, [modules, formData.module]);

    // Sync display query with selected module id
    useEffect(() => {
        if (selectedModule) {
            const grade = selectedModule?.grade?.name || selectedModule?.grade || "";
            const level = selectedModule?.level?.name || selectedModule?.level || "";
            const stream = selectedModule?.subjectStream ? ` — ${selectedModule.subjectStream}` : "";
            const display = `${selectedModule.name}${grade || level ? ` — ${grade || level}` : ""}${stream}`;
            setModuleQuery(display);
        } else if (!showModuleDropdown) {
            setModuleQuery("");
        }
    }, [selectedModule, showModuleDropdown]);

    const filteredModules = useMemo(() => {
        const q = String(moduleQuery || "").trim().toLowerCase();
        if (!q) return modules;
        return modules.filter((m) => {
            const name = String(m?.name || "").toLowerCase();
            const grade = String(m?.grade?.name || m?.grade || "").toLowerCase();
            const level = String(m?.level?.name || m?.level || "").toLowerCase();
            const stream = String(m?.subjectStream || "").toLowerCase();
            return name.includes(q) || grade.includes(q) || level.includes(q) || stream.includes(q);
        });
    }, [modules, moduleQuery]);

    const handleModuleQueryChange = (e) => {
        const v = e.target.value;
        setModuleQuery(v);
        // clear selected module id while typing
        setFormData((prev) => ({ ...prev, module: "" }));
        if (error) setError("");
        setShowModuleDropdown(true);
    };

    const handleSelectModule = (item) => {
        setFormData((prev) => ({ ...prev, module: String(item._id) }));
        const grade = item?.grade?.name || item?.grade || "";
        const level = item?.level?.name || item?.level || "";
        const stream = item?.subjectStream ? ` — ${item.subjectStream}` : "";
        const display = `${item.name}${grade || level ? ` — ${grade || level}` : ""}${stream}`;
        setModuleQuery(display);
        setShowModuleDropdown(false);
        if (moduleInputRef.current) moduleInputRef.current.blur();
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setError("");
                const [lessonData, moduleData] = await Promise.all([
                    lessonService.getAllLessons(),
                    moduleService.getAllModules(),
                ]);

                const lesson = Array.isArray(lessonData) ? lessonData.find((item) => item._id === id) : null;
                
                if (!lesson) {
                    setError("Lesson not found. It may have been deleted.");
                    return;
                }

                setModules(Array.isArray(moduleData) ? moduleData : []);
                setFormData({
                    title: lesson.title || "",
                    description: lesson.description || "",
                    module: lesson.module?._id || "",
                    materialUrl: toPublicMediaUrl(lesson.materialUrl || ""),
                    videoUrl: toPublicMediaUrl(lesson.videoUrl || ""),
                    zoomStartTime: toDateTimeLocalValue(lesson.onlineMeeting?.startTime),
                    isLive: Boolean(lesson.onlineMeeting && (lesson.onlineMeeting.startTime || lesson.onlineMeeting.joinUrl)),
                });
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load lesson details.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        if (error) setError(""); // Clear error to improve UX
        
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleFileChange = (event) => {
        const { name, files } = event.target;
        if (error) setError("");
        if (!files || files.length === 0) return;

        const file = files[0];
        const objectUrl = URL.createObjectURL(file);

        if (name === "materialUrl") {
            setMediaFiles((prev) => ({ ...prev, material: file }));
            setFormData((prev) => ({ ...prev, materialUrl: objectUrl }));
            return;
        }

        if (name === "videoUrl") {
            setMediaFiles((prev) => ({ ...prev, video: file }));
            setFormData((prev) => ({ ...prev, videoUrl: objectUrl }));
        }
    };

    const handleMaterialDownload = async () => {
        const fallbackUrl = toPublicMediaUrl(formData.materialUrl);
        if (!fallbackUrl) return;
        
        setIsDownloading(true);
        const isRemoteAsset = /^https?:\/\//i.test(fallbackUrl);

        if (/^blob:/i.test(fallbackUrl) || !id) {
            await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
            setIsDownloading(false);
            return;
        }

        try {
            setError("");
            const { downloadUrl: signedUrl, fileName } = await lessonService.getMaterialDownloadUrl(id);
            const targetUrl = signedUrl || fallbackUrl;
            const targetFileName = fileName || inferFileNameFromUrl(targetUrl);
            await downloadFile(targetUrl, targetFileName);
        } catch {
            if (!isRemoteAsset || /^blob:/i.test(fallbackUrl)) {
                await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
            } else {
                setError("Failed to generate secure material link. Please refresh and try again.");
            }
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.title.trim()) return setError("Lesson title is required.");
        if (!formData.module.trim()) return setError("Please select a module.");
        if (formData.isLive) {
            if (!formData.materialUrl && !mediaFiles.material) {
                return setError("Live sessions require a lesson material (PDF/Word).");
            }
        } else {
            if (!formData.materialUrl && !formData.videoUrl && !mediaFiles.material && !mediaFiles.video) {
                return setError("Please add at least one lesson resource (document or video).");
            }
        }
        
        setIsSubmitting(true);
        setError("");

        try {
            const payload = new FormData();
            payload.append("title", formData.title.trim());
            payload.append("description", formData.description.trim());
            payload.append("module", formData.module);
            payload.append("createZoomMeeting", String(Boolean(formData.isLive)));

            if (formData.isLive && formData.zoomStartTime) {
                payload.append("zoomStartTime", new Date(formData.zoomStartTime).toISOString());
            }

            if (mediaFiles.material) {
                payload.append("material", mediaFiles.material);
            } else if (formData.materialUrl && /^https?:\/\//i.test(formData.materialUrl)) {
                payload.append("materialUrl", formData.materialUrl.trim());
            }

            if (!formData.isLive) {
                if (mediaFiles.video) {
                    payload.append("video", mediaFiles.video);
                } else if (formData.videoUrl && /^https?:\/\//i.test(formData.videoUrl)) {
                    payload.append("videoUrl", formData.videoUrl.trim());
                }
            }

            await lessonService.updateLesson(id, payload);
            navigate("/teacher/lessons/manage");
        } catch (err) {
            const firstValidationMessage = err.response?.data?.errors?.[0]?.message;
            const backendError = err.response?.data?.error;
            setError(firstValidationMessage || err.response?.data?.message || backendError || "Failed to update lesson. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
                    Edit Lesson
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Update lesson details, manage resources, and modify live session settings.
                </p>
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-slate-50 rounded-full">
                            <Loader2 className="w-8 h-8 text-[#207D86] animate-spin" />
                        </div>
                        <p className="text-slate-500 font-medium animate-pulse">Loading lesson details...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        
                        {/* Essential Information Section */}
                        <div className="space-y-6">
                            
                            {/* Searchable Module Select */}
                            <div className="space-y-2">
                                <label htmlFor="moduleSearch" className="text-sm font-bold text-slate-700">
                                    Module <span className="text-red-500">*</span>
                                </label>
                                
                                <div 
                                    className="relative group" 
                                    onBlur={(e) => {
                                        // Close dropdown if clicked outside this container
                                        if (!e.currentTarget.contains(e.relatedTarget)) {
                                            setShowModuleDropdown(false);
                                            if (!formData.module) setModuleQuery("");
                                        }
                                    }}
                                >
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <Library className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="moduleSearch"
                                        ref={moduleInputRef}
                                        type="text"
                                        name="moduleSearch"
                                        value={moduleQuery}
                                        onChange={handleModuleQueryChange}
                                        onFocus={() => setShowModuleDropdown(true)}
                                        placeholder="Search for a module..."
                                        className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200"
                                        autoComplete="off"
                                    />

                                    {/* Dropdown Results */}
                                    {showModuleDropdown && (
                                        <ul className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2 animate-in fade-in zoom-in-95 duration-200">
                                            {filteredModules.length > 0 ? (
                                                filteredModules.map((item) => (
                                                    <li
                                                        key={item._id}
                                                        onMouseDown={(e) => { 
                                                            e.preventDefault(); 
                                                            handleSelectModule(item); 
                                                        }}
                                                        className="px-4 py-3 hover:bg-[#207D86]/5 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="text-sm font-extrabold text-slate-800 line-clamp-1">
                                                                {item.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                                    {item?.grade?.name || item?.grade || item?.level?.name || item?.level || ""}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isAdvancedModule(item) && item?.subjectStream && (
                                                            <div className="text-xs text-indigo-500 font-medium mt-1 flex items-center gap-1">
                                                                <GitBranch className="w-3 h-3" />
                                                                Stream: {item.subjectStream}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-4 py-8 text-center text-sm text-slate-500">
                                                    No modules found matching your search.
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </div>

                                {/* Selected Module Info Badges */}
                                {selectedModule && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200 shadow-sm">
                                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-400">Level:</span> {selectedModule?.level?.name || selectedModule?.level || "N/A"}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200 shadow-sm">
                                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-400">Grade:</span> {selectedModule?.grade?.name || selectedModule?.grade || "N/A"}
                                        </span>
                                        {isAdvancedModule(selectedModule) && selectedModule?.subjectStream && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-xs font-medium text-indigo-700 border border-indigo-100 shadow-sm">
                                                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                                                <span className="text-indigo-400">Stream:</span> {selectedModule.subjectStream}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Title Input */}
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-bold text-slate-700">
                                    Lesson Title <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <Type className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="title"
                                        name="title"
                                        type="text"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200"
                                        placeholder="e.g., Introduction to Algebra"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Description Textarea */}
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-bold text-slate-700">
                                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <AlignLeft className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 resize-none"
                                        placeholder="A short summary of this lesson..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Media & Live Settings Section */}
                        <div className="space-y-6 pt-6 border-t border-slate-100">
                            
                            {/* Live Session Toggle (Disabled in Edit Mode if originally true) */}
                            <div className="flex items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-90">
                                <label className="relative inline-flex items-center cursor-not-allowed shrink-0 mt-1 sm:mt-0">
                                    <input 
                                        id="isLive" 
                                        name="isLive" 
                                        type="checkbox" 
                                        checked={formData.isLive} 
                                        disabled 
                                        className="sr-only peer" 
                                    />
                                    <div className={`w-12 h-6 ${formData.isLive ? 'bg-[#207D86]/80' : 'bg-slate-300'} rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${formData.isLive ? 'after:translate-x-full after:border-white' : ''}`}></div>
                                </label>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        Online Live (Zoom) Session
                                        {formData.isLive && <Radio className="w-4 h-4 text-red-500 animate-pulse" />}
                                    </div>
                                    <p className={`text-xs mt-0.5 font-medium ${formData.isLive ? "text-[#207D86]" : "text-slate-500"}`}>
                                        {formData.isLive 
                                            ? "Live meeting exists (Cannot toggle status here)." 
                                            : "Not live — Pre-recorded video/material mode."}
                                    </p>
                                </div>
                            </div>

                            {/* Conditional Zoom Time Input */}
                            {formData.isLive && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                                    <label htmlFor="zoomStartTime" className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-3">
                                        <Calendar className="w-4 h-4" />
                                        Zoom Meeting Date & Time
                                    </label>
                                    <input
                                        id="zoomStartTime"
                                        name="zoomStartTime"
                                        type="datetime-local"
                                        value={formData.zoomStartTime}
                                        onChange={handleInputChange}
                                        className="w-full sm:max-w-sm px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                    />
                                    <p className="text-xs text-indigo-700/70 mt-2 font-medium">
                                        Set a value to update the meeting. Clearing it will remove the meeting.
                                    </p>
                                </div>
                            )}

                            {/* Material Upload (PDF/Word) */}
                            <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                                <label htmlFor="materialUrl" className="text-sm font-bold text-slate-700 block mb-3">
                                    Update Lesson Document (PDF/Word)
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="materialUrl"
                                        name="materialUrl"
                                        type="file"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={handleFileChange}
                                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#207D86]/10 file:text-[#207D86] hover:file:bg-[#207D86]/20 cursor-pointer"
                                    />
                                </div>
                                {formData.materialUrl && (
                                    <button
                                        type="button"
                                        onClick={handleMaterialDownload}
                                        disabled={isDownloading}
                                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#207D86] font-bold hover:text-[#14555B] transition-colors disabled:opacity-60 disabled:cursor-wait"
                                    >
                                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        {isDownloading ? "Preparing Download..." : "Download Current Material"}
                                    </button>
                                )}
                            </div>

                            {/* Conditional Video Upload */}
                            {!formData.isLive && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                                    <label htmlFor="videoUrl" className="text-sm font-bold text-slate-700 block mb-3">
                                        Update Lesson Video (MP4/WebM)
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="videoUrl"
                                            name="videoUrl"
                                            type="file"
                                            accept="video/*"
                                            onChange={handleFileChange}
                                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#207D86]/10 file:text-[#207D86] hover:file:bg-[#207D86]/20 cursor-pointer"
                                        />
                                    </div>
                                    
                                    {formData.videoUrl && (
                                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
                                            <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Video className="w-4 h-4"/> Video Preview</span>
                                                <a href={toPublicMediaUrl(formData.videoUrl)} download className="flex items-center gap-1.5 text-xs font-bold text-[#207D86] hover:text-[#18646b]">
                                                    <Download className="w-3.5 h-3.5"/> Download Original
                                                </a>
                                            </div>
                                            <video 
                                                controls 
                                                className="w-full max-h-72 object-contain bg-black" 
                                                src={toPublicMediaUrl(formData.videoUrl)} 
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate("/teacher/lessons/manage")}
                                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all active:scale-[0.98]"
                            >
                                <X className="w-5 h-5" />
                                Cancel
                            </button>
                            
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto sm:ml-auto inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
};

export default LessonsEdit;