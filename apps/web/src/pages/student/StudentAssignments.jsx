import { useEffect, useMemo, useState } from "react";
import { 
    Search, 
    AlertCircle, 
    Loader2, 
    Download, 
    FileText, 
    Calendar,
    BookOpen,
    User,
    UploadCloud,
    CheckCircle2,
    X,
    Clock,
    AlertTriangle
} from "lucide-react";
import assignmentService from "../../services/AssignmentService";

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

const downloadFile = async (url, fileName = "") => {
    if (!url) return;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to download file");
    const fileBlob = await response.blob();
    const objectUrl = URL.createObjectURL(fileBlob);

    try {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName || inferFileNameFromUrl(url) || "assignment-material";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

const formatDateTime = (value) => {
    if (!value) return "No due date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No due date";
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const isLateSubmission = (submittedAt, dueDate) => {
    if (!submittedAt || !dueDate) return false;
    const submittedDate = new Date(submittedAt);
    const dueDateValue = new Date(dueDate);
    if (Number.isNaN(submittedDate.getTime()) || Number.isNaN(dueDateValue.getTime())) return false;
    return submittedDate.getTime() > dueDateValue.getTime();
};

const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const dueDateValue = new Date(dueDate);
    if (Number.isNaN(dueDateValue.getTime())) return false;
    return new Date().getTime() > dueDateValue.getTime();
};

// --- Main Component ---
const StudentAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("todo"); // 'todo' | 'completed'
    
    const [isSubmittingById, setIsSubmittingById] = useState({});
    const [expandedSubmitById, setExpandedSubmitById] = useState({});
    const [submissionFormById, setSubmissionFormById] = useState({});
    const [downloadingMaterialById, setDownloadingMaterialById] = useState({});
    const [error, setError] = useState("");

    const loadAssignments = async (q = "") => {
        try {
            setError("");
            setIsLoading(true);
            const assignmentData = await assignmentService.getAllAssignments({ q });
            setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load assignments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAssignments(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // Data Filtering & Organization
    const { pendingAssignments, completedAssignments } = useMemo(() => {
        const pending = [];
        const completed = [];
        
        assignments.forEach(assignment => {
            if (assignment?.studentSubmission) {
                completed.push(assignment);
            } else {
                pending.push(assignment);
            }
        });

        // Sort pending: Overdue first, then by nearest due date
        pending.sort((a, b) => {
            const dateA = new Date(a.dueDate).getTime();
            const dateB = new Date(b.dueDate).getTime();
            return dateA - dateB; 
        });

        // Sort completed: Most recently submitted first
        completed.sort((a, b) => {
            const dateA = new Date(a.studentSubmission.submittedAt || a.studentSubmission.createdAt).getTime();
            const dateB = new Date(b.studentSubmission.submittedAt || b.studentSubmission.createdAt).getTime();
            return dateB - dateA;
        });

        return { pendingAssignments: pending, completedAssignments: completed };
    }, [assignments]);

    const displayedAssignments = activeTab === "todo" ? pendingAssignments : completedAssignments;

    const handleOpenSubmit = (assignmentId) => {
        setExpandedSubmitById((prev) => ({ ...prev, [assignmentId]: !prev[assignmentId] }));
        setSubmissionFormById((prev) => {
            if (prev[assignmentId]) return prev;
            return {
                ...prev,
                [assignmentId]: { notes: "", file: null },
            };
        });
    };

    const handleSubmissionFieldChange = (assignmentId, field, value) => {
        setSubmissionFormById((prev) => ({
            ...prev,
            [assignmentId]: {
                notes: prev?.[assignmentId]?.notes || "",
                file: prev?.[assignmentId]?.file || null,
                [field]: value,
            },
        }));
    };

    const handleMaterialDownload = async (assignment) => {
        if (!assignment?._id || !assignment?.materialUrl) return;
        try {
            setError("");
            setDownloadingMaterialById((prev) => ({ ...prev, [assignment._id]: true }));
            const { downloadUrl, fileName } = await assignmentService.getMaterialDownloadUrl(assignment._id);
            const resolvedUrl = toPublicMediaUrl(downloadUrl || assignment.materialUrl);
            await downloadFile(resolvedUrl, fileName || inferFileNameFromUrl(resolvedUrl));
        } catch {
            setError("Failed to download assignment material");
        } finally {
            setDownloadingMaterialById((prev) => ({ ...prev, [assignment._id]: false }));
        }
    };

    const refreshSingleAssignmentSubmission = async (assignmentId) => {
        try {
            const latestSubmission = await assignmentService.getMyAssignmentSubmission(assignmentId);
            setAssignments((prev) =>
                prev.map((assignment) => {
                    if (String(assignment._id) !== String(assignmentId)) return assignment;
                    return { ...assignment, studentSubmission: latestSubmission || null };
                }),
            );
        } catch {
            await loadAssignments(searchQuery);
        }
    };

    const handleSubmitAssignment = async (event, assignment) => {
        event.preventDefault();
        if (!assignment?._id) return;

        const formState = submissionFormById?.[assignment._id] || { notes: "", file: null };
        if (!formState.file) {
            setError("Please attach your assignment work file before submitting");
            return;
        }

        try {
            setError("");
            setIsSubmittingById((prev) => ({ ...prev, [assignment._id]: true }));

            const payload = new FormData();
            payload.append("submission", formState.file);
            if (formState.notes && formState.notes.trim()) {
                payload.append("notes", formState.notes.trim());
            }

            await assignmentService.submitAssignment(assignment._id, payload);
            await refreshSingleAssignmentSubmission(assignment._id);

            setExpandedSubmitById((prev) => ({ ...prev, [assignment._id]: false }));
            setSubmissionFormById((prev) => ({
                ...prev,
                [assignment._id]: { notes: "", file: null },
            }));
            
            // Auto-switch to completed tab to show them their success
            setActiveTab("completed");
        } catch (err) {
            const firstValidationMessage = err?.response?.data?.errors?.[0]?.message;
            setError(firstValidationMessage || err?.response?.data?.message || "Failed to submit assignment");
        } finally {
            setIsSubmittingById((prev) => ({ ...prev, [assignment._id]: false }));
        }
    };

    return (
        <section className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">My Assignments</h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Track your due dates, download materials, and submit your work.
                </p>
            </div>

            {/* Controls Row: Search & Tabs */}
            <div className="flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center mb-8">
                
                {/* Tab Switcher */}
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 w-full lg:w-auto">
                    <button
                        onClick={() => setActiveTab("todo")}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
                            activeTab === "todo" 
                                ? "bg-white text-[#207D86] shadow-sm border border-slate-200/60" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
                    >
                        <Clock className="w-4 h-4" /> 
                        To-Do
                        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                            activeTab === "todo" ? "bg-[#207D86]/10 text-[#207D86]" : "bg-slate-200 text-slate-600"
                        }`}>
                            {pendingAssignments.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("completed")}
                        className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
                            activeTab === "completed" 
                                ? "bg-white text-[#207D86] shadow-sm border border-slate-200/60" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
                    >
                        <CheckCircle2 className="w-4 h-4" /> 
                        Completed
                        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                            activeTab === "completed" ? "bg-[#207D86]/10 text-[#207D86]" : "bg-slate-200 text-slate-600"
                        }`}>
                            {completedAssignments.length}
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search assignments..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] shadow-sm transition-all"
                    />
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
                    <p className="text-slate-500 font-medium animate-pulse">Loading your assignments...</p>
                </div>
            ) : displayedAssignments.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                        {activeTab === "todo" ? (
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        ) : (
                            <FileText className="w-10 h-10 text-slate-300" />
                        )}
                    </div>
                    <h4 className="text-xl font-bold text-slate-700 mb-2">
                        {activeTab === "todo" ? "You're all caught up!" : "No completed assignments"}
                    </h4>
                    <p className="text-slate-500 max-w-md">
                        {searchQuery 
                            ? "We couldn't find any assignments matching your search." 
                            : activeTab === "todo" 
                                ? "You have no pending assignments right now. Great job!" 
                                : "You haven't submitted any assignments yet."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-5">
                    {displayedAssignments.map((assignment) => {
                        const submission = assignment?.studentSubmission || null;
                        const submittedAt = submission?.submittedAt || submission?.createdAt;
                        
                        const isLate = submission 
                            ? (typeof submission?.isLate === "boolean" ? submission.isLate : isLateSubmission(submittedAt, assignment?.dueDate))
                            : isOverdue(assignment?.dueDate);
                            
                        const submitForm = submissionFormById?.[assignment._id] || { notes: "", file: null };
                        const isSubmitting = Boolean(isSubmittingById?.[assignment._id]);
                        const isDownloadingMaterial = Boolean(downloadingMaterialById?.[assignment._id]);
                        const isSubmitOpen = Boolean(expandedSubmitById?.[assignment._id]);

                        return (
                            <article
                                key={assignment._id}
                                className={`group bg-white rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                                    isSubmitOpen 
                                        ? "border-[#207D86]/50 shadow-md ring-1 ring-[#207D86]/10" 
                                        : "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                                }`}
                            >
                                {/* Left Accent Line for Overdue/Late items */}
                                {isLate && activeTab === "todo" && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                )}

                                <div className={`p-5 sm:p-6 transition-colors ${isSubmitOpen ? "bg-slate-50/50 rounded-t-2xl" : ""}`}>
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                                        
                                        {/* Left Col: Info */}
                                        <div className="flex-1 space-y-4">
                                            
                                            {/* Header Row */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                        <BookOpen className="w-3 h-3" /> 
                                                        {assignment?.module?.name || "General"}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-extrabold text-[#0E2A47] group-hover:text-[#207D86] transition-colors leading-tight">
                                                    {assignment.title}
                                                </h3>
                                            </div>

                                            {/* Description */}
                                            {assignment?.description && (
                                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                                    {assignment.description}
                                                </p>
                                            )}

                                            {/* Meta Info Grid */}
                                            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm ${
                                                    isLate && activeTab === "todo" 
                                                        ? "bg-red-50 border-red-200 text-red-700" 
                                                        : "bg-white border-slate-200 text-slate-700"
                                                }`}>
                                                    {isLate && activeTab === "todo" ? <AlertTriangle className="w-4 h-4" /> : <Calendar className="w-4 h-4 text-[#207D86]" />} 
                                                    <span className="font-bold">{isLate && activeTab === "todo" ? "Overdue:" : "Due:"}</span> 
                                                    {formatDateTime(assignment?.dueDate)}
                                                </div>
                                                
                                                {assignment?.createdBy && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 shadow-sm">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        <span>{assignment.createdBy.firstName} {assignment.createdBy.lastName}</span>
                                                    </div>
                                                )}

                                                {submittedAt && (
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm ${isLate ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="font-bold">Submitted:</span> {formatDateTime(submittedAt)} {isLate && "(Late)"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Col: Action Buttons */}
                                        <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 shrink-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-none">
                                            {assignment?.materialUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMaterialDownload(assignment)}
                                                    disabled={isDownloadingMaterial}
                                                    className="w-full lg:w-48 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:opacity-60 shadow-sm"
                                                >
                                                    {isDownloadingMaterial ? <Loader2 className="w-4 h-4 animate-spin text-[#207D86]" /> : <Download className="w-4 h-4 text-[#207D86]" />}
                                                    {isDownloadingMaterial ? "Downloading..." : "Get Material"}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleOpenSubmit(assignment._id)}
                                                className={`w-full lg:w-48 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-4 shadow-sm active:scale-[0.98] ${
                                                    isSubmitOpen 
                                                        ? "bg-slate-800 text-white hover:bg-slate-700 focus:ring-slate-300" 
                                                        : submission 
                                                            ? "bg-white border border-[#207D86]/40 text-[#207D86] hover:bg-[#207D86]/5 focus:ring-[#207D86]/20" 
                                                            : "bg-[#207D86] text-white hover:bg-[#18646b] focus:ring-[#207D86]/30 shadow-[#207D86]/20"
                                                }`}
                                            >
                                                {isSubmitOpen ? <X className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                                                {isSubmitOpen ? "Cancel" : submission ? "Update Work" : "Submit Work"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Submission Drawer */}
                                {isSubmitOpen && (
                                    <div className="border-t border-slate-200 bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="p-5 sm:p-6 rounded-b-2xl max-w-4xl">
                                            <h4 className="text-base font-extrabold text-[#0E2A47] mb-4 flex items-center gap-2">
                                                <UploadCloud className="w-5 h-5 text-[#207D86]" /> 
                                                {submission ? "Upload Updated Revision" : "Upload Assignment File"}
                                            </h4>
                                            
                                            <form onSubmit={(event) => handleSubmitAssignment(event, assignment)} className="space-y-5">
                                                
                                                {/* File Drop/Select Area */}
                                                <div>
                                                    <label htmlFor={`submission-file-${assignment._id}`} className="block text-sm font-bold text-slate-700 mb-2">
                                                        Attachment <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative border-2 border-dashed border-slate-300 hover:border-[#207D86]/50 bg-white rounded-xl p-4 transition-colors group">
                                                        <input
                                                            id={`submission-file-${assignment._id}`}
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.zip,.txt,image/*"
                                                            onChange={(event) => handleSubmissionFieldChange(assignment._id, "file", event.target.files?.[0] || null)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="flex flex-col items-center justify-center text-center gap-2 pointer-events-none">
                                                            <div className={`p-3 rounded-full ${submitForm?.file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:text-[#207D86] group-hover:bg-[#207D86]/10'} transition-colors`}>
                                                                {submitForm?.file ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                                                            </div>
                                                            <div>
                                                                {submitForm?.file ? (
                                                                    <p className="text-sm font-bold text-emerald-700">{submitForm.file.name}</p>
                                                                ) : (
                                                                    <p className="text-sm font-semibold text-slate-700">Click to browse or drag file here</p>
                                                                )}
                                                                <p className="text-xs font-medium text-slate-500 mt-1">Accepts PDF, Word, ZIP, TXT, Images</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Notes Input */}
                                                <div>
                                                    <label htmlFor={`submission-notes-${assignment._id}`} className="block text-sm font-bold text-slate-700 mb-2">
                                                        Notes for Teacher (Optional)
                                                    </label>
                                                    <textarea
                                                        id={`submission-notes-${assignment._id}`}
                                                        rows={3}
                                                        value={submitForm?.notes || ""}
                                                        onChange={(event) => handleSubmissionFieldChange(assignment._id, "notes", event.target.value)}
                                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] outline-none transition-all placeholder:text-slate-400 bg-white shadow-sm"
                                                        placeholder="Add any context, questions, or comments regarding your submission..."
                                                    />
                                                </div>

                                                {/* Submit Action */}
                                                <div className="pt-2 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting || !submitForm?.file}
                                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#207D86] text-white text-sm font-bold shadow-md shadow-[#207D86]/20 hover:bg-[#18646b] focus:ring-4 focus:ring-[#207D86]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                                                    >
                                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                                                        {isSubmitting ? "Uploading Securely..." : submission ? "Submit Updated File" : "Confirm Submission"}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default StudentAssignments;