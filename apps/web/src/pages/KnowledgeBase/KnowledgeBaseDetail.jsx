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
            <section className="max-w-4xl mx-auto py-20 px-4 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="p-5 bg-white rounded-2xl shadow-lg border border-slate-100 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#207D86]/5 animate-pulse"></div>
                    <Loader2 className="w-10 h-10 text-[#207D86] animate-spin relative z-10" />
                </div>
                <p className="text-slate-400 font-bold tracking-wide uppercase text-sm animate-pulse">Loading Article...</p>
            </section>
        );
    }

    if (error || !entry) {
        return (
            <section className="max-w-3xl mx-auto py-16 px-4 animate-in fade-in slide-in-from-bottom-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#207D86] transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                </button>
                
                <div className="bg-white rounded-4xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col items-center justify-center p-12 md:p-16 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0A1D32] mb-3">Oops! Something went wrong</h2>
                    <p className="text-slate-500 max-w-md text-lg">
                        {error || "The article you are looking for does not exist or has been removed."}
                    </p>
                    <button 
                        onClick={() => navigate('/knowledge-base')} 
                        className="mt-8 px-8 py-3.5 bg-[#0A1D32] text-white font-bold rounded-xl hover:bg-[#207D86] transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Return to Knowledge Base
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* --- Top Navigation --- */}
            <nav className="mb-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#207D86] transition-colors focus:outline-none"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                    Back to Knowledge Base
                </button>
            </nav>

            {/* --- Article Header (Clean, Floating Style) --- */}
            <header className="mb-12 md:mb-16">
                <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#207D86]/10 text-[#207D86] text-xs font-bold uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5" />
                        {entry.category || "General"}
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0A1D32] leading-[1.1] mb-8 tracking-tight">
                    {entry.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm font-medium border-y border-slate-200 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Written By</p>
                            <p className="text-[#0A1D32] font-bold text-base">{entry.authorName || "Teacher"}</p>
                        </div>
                    </div>
                    
                    <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Last Updated</p>
                            <p className="text-slate-700 font-semibold text-base">
                                {new Date(entry.updatedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Article Body --- */}
            <article className="bg-white rounded-4xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mb-12">
                <div className="p-8 md:p-12 lg:p-16">
                    <div className="prose prose-slate prose-lg max-w-none">
                        <div className="whitespace-pre-line text-slate-600 leading-loose text-lg font-normal">
                            {entry.content}
                        </div>
                    </div>
                </div>

                {/* --- Attachments Footer --- */}
                {Array.isArray(entry.attachmentUrls) && entry.attachmentUrls.length > 0 && (
                    <footer className="p-8 md:p-12 bg-slate-50 border-t border-slate-100">
                        <h3 className="text-sm font-black text-[#0A1D32] uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-[#207D86]" /> 
                            Resources & Attachments ({entry.attachmentUrls.length})
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {entry.attachmentUrls.map((aUrl, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-[#207D86] hover:shadow-md transition-all duration-300 group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-indigo-100/50 shrink-0 text-indigo-500 group-hover:scale-105 transition-transform">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-bold text-[#0A1D32] truncate group-hover:text-[#207D86] transition-colors" title={inferFileNameFromUrl(aUrl) || `Attachment ${idx + 1}`}>
                                                {inferFileNameFromUrl(aUrl) || `Attachment ${idx + 1}`}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                Downloadable File
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAttachmentDownload(aUrl, idx)}
                                        disabled={downloadingIdx === idx}
                                        className="shrink-0 p-3 rounded-xl text-slate-400 hover:text-white hover:bg-[#207D86] transition-colors disabled:opacity-50 disabled:cursor-wait focus:outline-none"
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