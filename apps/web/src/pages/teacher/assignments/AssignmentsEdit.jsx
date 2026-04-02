import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
    Library, 
    Type, 
    AlignLeft, 
    Calendar, 
    FileUp, 
    AlertCircle, 
    Loader2, 
    Save, 
    X,
    Layers,
    GraduationCap,
    Download
} from "lucide-react";
import assignmentService from "../../../services/AssignmentService";
import moduleService from "../../../services/ModuleService";

const initialForm = {
    title: "",
    description: "",
    module: "",
    dueDate: "",
    materialUrl: "",
};

const toDateTimeLocalValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
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

const AssignmentsEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [modules, setModules] = useState([]);
    const [formData, setFormData] = useState(initialForm);
    const [materialFile, setMaterialFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState("");

    const selectedModule = useMemo(() => {
        if (!formData.module) return null;
        return modules.find((item) => String(item._id) === String(formData.module)) || null;
    }, [modules, formData.module]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setError("");
                const [assignment, moduleData] = await Promise.all([
                    assignmentService.getAssignmentById(id),
                    moduleService.getAllModules(),
                ]);

                if (!assignment?._id) {
                    setError("Assignment not found. It may have been deleted.");
                    return;
                }

                setModules(Array.isArray(moduleData) ? moduleData : []);
                setFormData({
                    title: assignment?.title || "",
                    description: assignment?.description || "",
                    module: assignment?.module?._id || "",
                    dueDate: toDateTimeLocalValue(assignment?.dueDate),
                    materialUrl: assignment?.materialUrl || "",
                });
            } catch (err) {
                setError(err?.response?.data?.message || "Failed to load assignment details.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        if (error) setError(""); // Clear error to improve UX
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (event) => {
        if (error) setError("");
        setMaterialFile(event.target.files?.[0] || null);
    };

    const handleDownloadMaterial = async () => {
        if (!id || !formData.materialUrl) return;
        setIsDownloading(true);
        try {
            setError("");
            const { downloadUrl, fileName } = await assignmentService.getMaterialDownloadUrl(id);
            await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
        } catch {
            setError("Failed to securely download assignment material. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.title.trim()) return setError("Assignment title is required.");
        if (!formData.module.trim()) return setError("Please select a module.");

        try {
            setError("");
            setIsSubmitting(true);

            const payload = new FormData();
            payload.append("title", formData.title.trim());
            payload.append("description", formData.description.trim());
            payload.append("module", formData.module);
            
            if (formData.dueDate) {
                payload.append("dueDate", new Date(formData.dueDate).toISOString());
            }
            if (materialFile) {
                payload.append("material", materialFile);
            }

            await assignmentService.updateAssignment(id, payload);
            navigate("/teacher/assignments/manage");
        } catch (err) {
            const firstValidationMessage = err?.response?.data?.errors?.[0]?.message;
            setError(firstValidationMessage || err?.response?.data?.message || "Failed to update assignment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
                    Edit Assignment
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Update assignment details, due dates, and attached materials.
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
                        <p className="text-slate-500 font-medium animate-pulse">Loading assignment details...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        
                        <div className="space-y-6">
                            {/* Module Select */}
                            <div className="space-y-2">
                                <label htmlFor="module" className="text-sm font-bold text-slate-700">
                                    Target Module <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <Library className="w-5 h-5" />
                                    </div>
                                    <select
                                        id="module"
                                        name="module"
                                        value={formData.module}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 appearance-none"
                                    >
                                        <option value="">Select module...</option>
                                        {modules.map((item) => (
                                            <option key={item._id} value={item._id}>
                                                {item.name} {item?.grade?.name ? `— ${item.grade.name}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Selected Module Info Badge */}
                                {selectedModule && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200 shadow-sm">
                                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-400">Level:</span> {selectedModule?.level?.name || "N/A"}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200 shadow-sm">
                                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-400">Grade:</span> {selectedModule?.grade?.name || "N/A"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Title Input */}
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-bold text-slate-700">
                                    Assignment Title <span className="text-red-500">*</span>
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
                                        placeholder="e.g., Complete Worksheet 01"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Grid for Due Date & File Upload */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                {/* Due Date Input */}
                                <div className="space-y-2">
                                    <label htmlFor="dueDate" className="text-sm font-bold text-slate-700">
                                        Due Date & Time <span className="text-slate-400 font-normal">(Optional)</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="dueDate"
                                            name="dueDate"
                                            type="datetime-local"
                                            value={formData.dueDate}
                                            onChange={handleInputChange}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                {/* Material Upload */}
                                <div className="space-y-2">
                                    <label htmlFor="material" className="text-sm font-bold text-slate-700">
                                        Replace Material <span className="text-slate-400 font-normal">(Optional)</span>
                                    </label>
                                    <div className="relative group h-full">
                                        <div className="absolute inset-y-[10px] left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors z-10">
                                            <FileUp className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="material"
                                            name="material"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.zip,.txt,image/*"
                                            onChange={handleFileChange}
                                            className="w-full pl-11 pr-4 py-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#207D86]/10 file:text-[#207D86] hover:file:bg-[#207D86]/20 cursor-pointer"
                                        />
                                    </div>
                                    
                                    {/* Existing Material Download Button */}
                                    {formData.materialUrl && (
                                        <button
                                            type="button"
                                            onClick={handleDownloadMaterial}
                                            disabled={isDownloading}
                                            className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#207D86] font-bold hover:text-[#18646b] transition-colors disabled:opacity-60 disabled:cursor-wait"
                                        >
                                            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            {isDownloading ? "Downloading..." : "Download Current Material"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Description Textarea */}
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-bold text-slate-700">
                                    Description & Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <AlignLeft className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 resize-y min-h-[100px]"
                                        placeholder="Add any specific instructions, rubrics, or context for this assignment..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate("/teacher/assignments/manage")}
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

export default AssignmentsEdit;