import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    AlertCircle, 
    Loader2, 
    BookOpen,
    Globe,
    EyeOff,
    FileText,
    Download,
    Paperclip
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import knowledgeBaseService from "../../../services/KnowledgeBaseService";

const MySwal = withReactContent(Swal);

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
    if (/^blob:/i.test(url)) {
        const blobLink = document.createElement("a");
        blobLink.href = url;
        blobLink.download = fileName || "attachment";
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
        link.download = fileName || inferFileNameFromUrl(url) || "attachment";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

const KnowledgeBaseManage = () => {
    const [entries, setEntries] = useState([]);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingFile, setDownloadingFile] = useState(null); // Tracks { entryId, index }

    const loadEntries = async (search = "") => {
        try {
            setError("");
            setIsLoading(true);
            const data = await knowledgeBaseService.getAllEntries(search);
            setEntries(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load entries.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadEntries(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this! The article and its attachments will be permanently deleted.",
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
            await knowledgeBaseService.deleteEntry(id);
            await loadEntries(query);
            
            MySwal.fire({
                title: "Deleted!",
                text: "The article has been removed.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete article.");
        }
    };

    const togglePublished = async (entry) => {
        try {
            setError("");
            await knowledgeBaseService.updateEntry(entry.id, {
                ...entry,
                isPublished: !entry.isPublished,
            });
            await loadEntries(query);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update publish status.");
        }
    };

    const handleAttachmentDownload = async (entry, index, attachmentUrl) => {
        setDownloadingFile({ entryId: entry.id, index });
        try {
            const { downloadUrl, fileName } = await knowledgeBaseService.getAttachmentDownloadUrl(entry.id, true, index);
            if (downloadUrl) {
                await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
                return;
            }
            const url = toPublicMediaUrl(attachmentUrl);
            await downloadFile(url, inferFileNameFromUrl(url));
        } catch (err) {
            // Fallback to opening in new tab
            window.open(attachmentUrl, "_blank", "noopener,noreferrer");
        } finally {
            setDownloadingFile(null);
        }
    };

    return (
        <section className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">Manage Knowledge Base</h2>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        Organize, edit, and publish your educational resources and articles.
                    </p>
                </div>

                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate("/teacher/knowledge-base/add")}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98] w-full md:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Add Article
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-6 relative z-10">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search your articles by title or content..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all"
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
                    <p className="text-slate-500 font-medium animate-pulse">Fetching articles...</p>
                </div>
            ) : entries.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                        <BookOpen className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-700 mb-2">No articles found</h4>
                    <p className="text-slate-500 max-w-md">
                        {query 
                            ? "We couldn't find any articles matching your search. Try different keywords." 
                            : "Your knowledge base is empty. Start by creating your first article."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-5">
                    {entries.map((entry) => (
                        <article 
                            key={entry.id} 
                            className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#207D86]/30 transition-all duration-200"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                
                                {/* Article Content */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-xl font-extrabold text-[#0E2A47] group-hover:text-[#207D86] transition-colors leading-tight">
                                                {entry.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">
                                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                    {entry.category}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium ml-1">
                                                    Updated {new Date(entry.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Status Badge */}
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm whitespace-nowrap ${entry.isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                            {entry.isPublished ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            {entry.isPublished ? "Published" : "Draft"}
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                                        {entry.content}
                                    </p>

                                    {/* Attachments Section */}
                                    {Array.isArray(entry.attachmentUrls) && entry.attachmentUrls.length > 0 && (
                                        <div className="pt-3">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <Paperclip className="w-3.5 h-3.5" /> Attachments ({entry.attachmentUrls.length})
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {entry.attachmentUrls.map((url, i) => {
                                                    const isDownloading = downloadingFile?.entryId === entry.id && downloadingFile?.index === i;
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleAttachmentDownload(entry, i, url)}
                                                            disabled={isDownloading}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-60 disabled:cursor-wait"
                                                        >
                                                            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                            File {i + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => navigate(`/teacher/knowledge-base/edit/${entry.id}`)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                
                                <button
                                    onClick={() => togglePublished(entry)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-none"
                                >
                                    {entry.isPublished ? (
                                        <><EyeOff className="w-4 h-4 text-amber-600" /> Unpublish</>
                                    ) : (
                                        <><Globe className="w-4 h-4 text-emerald-600" /> Publish</>
                                    )}
                                </button>
                                
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors sm:ml-auto focus:ring-2 focus:ring-red-200 focus:outline-none"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};

export default KnowledgeBaseManage;