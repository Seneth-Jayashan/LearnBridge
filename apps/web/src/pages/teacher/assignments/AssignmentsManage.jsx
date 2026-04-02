import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    AlertCircle, 
    Loader2, 
    Download, 
    FileText, 
    Calendar,
    Users,
    ChevronDown,
    ChevronUp,
    Library
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import assignmentService from "../../../services/AssignmentService";

const MySwal = withReactContent(Swal);

const formatDateTime = (value) => {
    if (!value) return "No due date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No due date";
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const AssignmentsManage = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Submissions State
    const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
    const [submissionsLoading, setSubmissionsLoading] = useState({});
    const [submissionsDownloading, setSubmissionsDownloading] = useState({});
    const [openSubmissions, setOpenSubmissions] = useState({});

    const loadData = async (q = "") => {
        try {
            setError("");
            setIsLoading(true);
            const assignmentData = await assignmentService.getAllAssignments({ q });
            setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load assignments.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleDelete = async (assignmentId) => {
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this! This action will delete the assignment permanently.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626", // Tailwind red-600
            cancelButtonColor: "#94a3b8",  // Tailwind slate-400
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
            await assignmentService.deleteAssignment(assignmentId);
            await loadData(searchQuery);
            MySwal.fire({
                title: "Deleted!",
                text: "The assignment has been removed.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete assignment.");
        }
    };

    const handleToggleSubmissions = async (assignmentId) => {
        const isOpen = Boolean(openSubmissions[assignmentId]);

        if (isOpen) {
            setOpenSubmissions((prev) => ({ ...prev, [assignmentId]: false }));
            return;
        }

        setOpenSubmissions((prev) => ({ ...prev, [assignmentId]: true }));

        // Only fetch if we don't already have the data
        if (submissionsByAssignment[assignmentId]) {
            return;
        }

        try {
            setSubmissionsLoading((prev) => ({ ...prev, [assignmentId]: true }));
            const submissions = await assignmentService.getAssignmentSubmissions(assignmentId);
            setSubmissionsByAssignment((prev) => ({
                ...prev,
                [assignmentId]: Array.isArray(submissions) ? submissions : [],
            }));
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load student submissions.");
        } finally {
            setSubmissionsLoading((prev) => ({ ...prev, [assignmentId]: false }));
        }
    };

    const handleDownload = async (submission, assignmentId) => {
        if (!submission?.fileUrl) return;
        setError("");
        setSubmissionsDownloading((prev) => ({ ...prev, [submission._id]: true }));
        try {
            const { downloadUrl } = await assignmentService.getSubmissionDownloadUrl(assignmentId, submission._id);
            if (!downloadUrl) throw new Error("Download URL unavailable");

            // Navigate to the signed download URL to let the browser handle the download.
            window.location.assign(downloadUrl);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to securely download file.");
            // Fallback: open original file URL in a new tab
            try {
                window.open(submission.fileUrl, '_blank', 'noopener');
            } catch {
                // ignore
            }
        } finally {
            setSubmissionsDownloading((prev) => ({ ...prev, [submission._id]: false }));
        }
    };

    return (
        <section className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">Manage Assignments</h2>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        Organize tasks, edit details, and review student submissions.
                    </p>
                </div>

                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate("/teacher/assignments/add")}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98] w-full md:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Add Assignment
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-6 relative z-10">
                <div className="relative w-full md:max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search assignments..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all"
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
            <div className="space-y-4">
                <div className="px-1 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#207D86]" />
                        Your Assignments
                    </h3>
                    {!isLoading && (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                            {assignments.length} Total
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
                            <Loader2 className="w-8 h-8 text-[#207D86] animate-spin" />
                        </div>
                        <p className="text-slate-500 font-medium animate-pulse">Loading assignments...</p>
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                            <FileText className="w-10 h-10 text-slate-300" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-700 mb-2">No assignments found</h4>
                        <p className="text-slate-500 max-w-md">
                            {searchQuery 
                                ? "No assignments match your search query." 
                                : "Start assigning work by clicking 'Add Assignment'."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map((assignment) => (
                            <article 
                                key={assignment._id} 
                                className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#207D86]/30 transition-all duration-200"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    
                                    {/* Assignment Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h4 className="font-extrabold text-slate-800 text-lg group-hover:text-[#207D86] transition-colors">
                                                    {assignment.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                        <Library className="w-3 h-3" /> 
                                                        {assignment?.module?.name || "Unknown module"}
                                                    </span>
                                                    {assignment?.module?.grade?.name && (
                                                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                            {assignment.module.grade.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Due Date Badge */}
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shadow-sm whitespace-nowrap">
                                                <Calendar className="w-4 h-4 text-amber-600" />
                                                Due: {formatDateTime(assignment.dueDate)}
                                            </div>
                                        </div>
                                        
                                        {assignment.description && (
                                            <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
                                                {assignment.description}
                                            </p>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="pt-2 flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/teacher/assignments/edit/${assignment._id}`)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                                title="Edit Assignment"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(assignment._id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors focus:ring-2 focus:ring-red-200 focus:outline-none"
                                                title="Delete Assignment"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                            
                                            <div className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSubmissions(assignment._id)}
                                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all focus:outline-none focus:ring-2 ${
                                                        openSubmissions[assignment._id] 
                                                            ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 focus:ring-slate-200" 
                                                            : "bg-[#207D86]/10 border-[#207D86]/20 text-[#207D86] hover:bg-[#207D86]/20 focus:ring-[#207D86]/30"
                                                    }`}
                                                >
                                                    <Users className="w-4 h-4" />
                                                    {openSubmissions[assignment._id] ? "Hide Submissions" : "View Submissions"}
                                                    {openSubmissions[assignment._id] ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submissions Drawer */}
                                {openSubmissions[assignment._id] && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                            <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                                                <Users className="w-4 h-4 text-slate-500" /> Student Submissions
                                            </h5>
                                            
                                            {submissionsLoading[assignment._id] ? (
                                                <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
                                                    <Loader2 className="w-4 h-4 animate-spin text-[#207D86]" /> Loading submissions...
                                                </div>
                                            ) : (submissionsByAssignment[assignment._id] || []).length === 0 ? (
                                                <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-white">
                                                    <p className="text-sm font-medium text-slate-500">No student submissions yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-2">
                                                    {(submissionsByAssignment[assignment._id] || []).map((submission) => (
                                                        <div
                                                            key={submission._id}
                                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors shadow-sm"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {submission?.student?.firstName || "Unknown"} {submission?.student?.lastName || "Student"}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                                        ID: {submission?.student?.regNumber || "N/A"}
                                                                    </span>
                                                                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        Submitted: {formatDateTime(submission?.submittedAt || submission?.createdAt)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            {submission?.fileUrl ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDownload(submission, assignment._id)}
                                                                    disabled={Boolean(submissionsDownloading[submission._id])}
                                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                                >
                                                                    {submissionsDownloading[submission._id] ? (
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    ) : (
                                                                        <Download className="w-3.5 h-3.5" />
                                                                    )}
                                                                    {submissionsDownloading[submission._id] ? 'Downloading...' : 'Download File'}
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                                    No File Attached
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AssignmentsManage;