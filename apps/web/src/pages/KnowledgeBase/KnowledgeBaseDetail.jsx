import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    ArrowLeft, 
    BookOpen, 
    Calendar, 
    User, 
    Paperclip, 
    Download, 
    Loader2, 
    AlertCircle, 
    Tag 
} from "lucide-react";
import knowledgeBaseService from "../../services/KnowledgeBaseService";

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

// --- Main Component ---
const KnowledgeBaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [entry, setEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingIdx, setDownloadingIdx] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setError("");
                setIsLoading(true);
                const data = await knowledgeBaseService.getPublicEntry(id);
                if (!data) {
                    setError("Article not found or is no longer published.");
                    setEntry(null);
                } else {
                    setEntry(data);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load article. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    const handleAttachmentDownload = async (aUrl, idx) => {
        setDownloadingIdx(idx);
        try {
            const { downloadUrl, fileName } = await knowledgeBaseService.getAttachmentDownloadUrl(entry.id, true, idx);
            if (downloadUrl) {
                await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
                return;
            }

            // Fallback to direct download attempt
            const url = toPublicMediaUrl(aUrl);
            await downloadFile(url, inferFileNameFromUrl(url));
        } catch (err) {
            // Final fallback: open in new tab
            window.open(aUrl, "_blank", "noopener,noreferrer");
        } finally {
            setDownloadingIdx(null);
        }
    };

    if (isLoading) {
        return (
            <section className="max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="p-4 bg-slate-50 rounded-full border border-slate-100 mb-4 shadow-sm">
                    <Loader2 className="w-8 h-8 text-[#207D86] animate-spin" />
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Loading article...</p>
            </section>
        );
    }

    if (error || !entry) {
        return (
            <section className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#207D86] transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Oops! Something went wrong</h2>
                    <p className="text-slate-500 max-w-md">
                        {error || "The article you are looking for does not exist or has been removed."}
                    </p>
                    <button 
                        onClick={() => navigate('/student/knowledge-base')} 
                        className="mt-6 px-6 py-2.5 bg-[#207D86] text-white font-semibold rounded-xl hover:bg-[#18646b] transition-colors shadow-md"
                    >
                        Return to Knowledge Base
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Top Navigation */}
            <nav className="mb-6">
                <button 
                    onClick={() => navigate(-1)} 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#207D86] transition-colors focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 rounded-lg py-1 pr-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
                </button>
            </nav>

            {/* Article Container */}
            <article className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                
                {/* Article Header */}
                <header className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#207D86]/10 text-[#207D86] text-xs font-extrabold uppercase tracking-wider">
                            <Tag className="w-3.5 h-3.5" />
                            {entry.category || "General"}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#0E2A47] leading-tight mb-6">
                        {entry.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>By <span className="text-slate-700 font-semibold">{entry.authorName || "Teacher"}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Updated {new Date(entry.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </header>

                {/* Article Body */}
                <div className="p-6 md:p-10">
                    <div className="prose prose-slate max-w-none">
                        <div className="whitespace-pre-line text-slate-700 leading-relaxed text-base md:text-lg">
                            {entry.content}
                        </div>
                    </div>
                </div>

                {/* Attachments Footer */}
                {Array.isArray(entry.attachmentUrls) && entry.attachmentUrls.length > 0 && (
                    <footer className="p-6 md:p-10 border-t border-slate-100 bg-slate-50">
                        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-[#207D86]" /> 
                            Attachments ({entry.attachmentUrls.length})
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {entry.attachmentUrls.map((aUrl, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-[#207D86]/30 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                                            <BookOpen className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-bold text-slate-700 truncate" title={inferFileNameFromUrl(aUrl) || `Attachment ${idx + 1}`}>
                                                {inferFileNameFromUrl(aUrl) || `Attachment ${idx + 1}`}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase">
                                                Downloadable Resource
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAttachmentDownload(aUrl, idx)}
                                        disabled={downloadingIdx === idx}
                                        className="shrink-0 p-2 rounded-lg text-[#207D86] hover:bg-[#207D86]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 disabled:opacity-50 disabled:cursor-wait"
                                        title={`Download attachment ${idx + 1}`}
                                    >
                                        {downloadingIdx === idx ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </footer>
                )}
            </article>
        </section>
    );
};

export default KnowledgeBaseDetail;