import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
    Book, 
    Type, 
    AlignLeft, 
    FolderTree, 
    Tag, 
    AlertCircle, 
    Loader2, 
    Save, 
    X,
    UploadCloud,
    FileText,
    Image as ImageIcon,
    Video,
    File as FileIcon,
    Download,
    Paperclip
} from "lucide-react";
import knowledgeBaseService from "../../../services/KnowledgeBaseService";

const KB_CATEGORIES = [
    "Teaching Materials",
    "Community Resources",
    "Student Support",
    "Parent Guidance",
    "Agriculture & Environment",
    "Health & Hygiene",
    "Local Curriculum",
    "Assessment & Exams",
    "Administration",
    "Technical Guides",
];

const initialForm = {
    title: "",
    content: "",
    category: KB_CATEGORIES[0],
    customCategory: "",
    isPublished: false,
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

const toPublicMediaUrl = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    const origin = apiBase.replace(/\/api\/v1\/?$/i, "");
    return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
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

// Helper to get file type icon
const getFileIcon = (fileType, fileName) => {
    if (!fileType) return <FileIcon className="w-6 h-6 text-slate-400" />;
    if (fileType.startsWith("image/")) return <ImageIcon className="w-6 h-6 text-emerald-500" />;
    if (fileType.startsWith("video/")) return <Video className="w-6 h-6 text-blue-500" />;
    if (fileType === "application/pdf") return <FileText className="w-6 h-6 text-red-500" />;
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return <FileText className="w-6 h-6 text-blue-600" />;
    return <FileIcon className="w-6 h-6 text-slate-400" />;
};

const KnowledgeBaseEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [downloadingIdx, setDownloadingIdx] = useState(null);
    const [error, setError] = useState("");

    const [existingPreviews, setExistingPreviews] = useState([]); // urls
    const [newFiles, setNewFiles] = useState(null); // File[]
    const [newPreviews, setNewPreviews] = useState([]);
    const fileRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                setError("");
                setIsLoading(true);
                const rows = await knowledgeBaseService.getAllEntries();
                const entry = Array.isArray(rows) ? rows.find((r) => r.id === id) : null;
                
                if (!entry) {
                    setError("Article not found. It may have been deleted.");
                    return;
                }
                
                setForm({
                    title: entry.title || "",
                    content: entry.content || "",
                    category: KB_CATEGORIES.includes(entry.category) ? entry.category : "Other",
                    customCategory: KB_CATEGORIES.includes(entry.category) ? "" : (entry.category || ""),
                    isPublished: Boolean(entry.isPublished),
                });
                
                const urls = Array.isArray(entry.attachmentUrls) ? entry.attachmentUrls : (entry.attachmentUrl ? [entry.attachmentUrl] : []);
                setExistingPreviews(urls.map((u) => ({ url: toPublicMediaUrl(u), name: inferFileNameFromUrl(u) })));
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load article details.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    useEffect(() => {
        return () => {
            newPreviews.forEach((p) => { try { URL.revokeObjectURL(p.url); } catch {} });
        };
    }, [newPreviews]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (error) setError(""); // Clear error to improve UX
        setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    };

    const handleFileChange = (e) => {
        if (error) setError("");
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (!files.length) return;
        
        const max = 5;
        const selected = files.slice(0, max);
        
        if (files.length > max) {
            setError(`You can only upload a maximum of ${max} files. Additional files were ignored.`);
        }

        setNewFiles(selected);
        const p = selected.map((f) => ({ url: URL.createObjectURL(f), name: f.name, type: f.type }));
        setNewPreviews(p);
        
        if (fileRef.current) fileRef.current.value = "";
    };

    const removeNewFileAt = (idx) => {
        if (!newFiles) return;
        const next = newFiles.slice(0, idx).concat(newFiles.slice(idx + 1));
        try { URL.revokeObjectURL(newPreviews[idx]?.url); } catch {}
        setNewFiles(next.length ? next : null);
        setNewPreviews(newPreviews.slice(0, idx).concat(newPreviews.slice(idx + 1)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.title.trim()) return setError("Article title is required.");
        if (!form.content.trim()) return setError("Article content is required.");
        if (form.category === "Other" && !form.customCategory.trim()) {
            return setError("Please specify the custom category name.");
        }

        try {
            setIsSubmitting(true);
            setError("");
            const payload = new FormData();
            payload.append("title", form.title.trim());
            payload.append("content", form.content.trim());
            payload.append("category", form.category === "Other" ? (form.customCategory?.trim() || "") : form.category);
            payload.append("isPublished", String(Boolean(form.isPublished)));

            if (newFiles && newFiles.length) {
                newFiles.forEach((f) => payload.append("attachment", f));
            }

            await knowledgeBaseService.updateEntry(id, payload);
            navigate("/teacher/knowledge-base/manage");
        } catch (err) {
            const firstValidationMessage = err.response?.data?.errors?.[0]?.message;
            setError(firstValidationMessage || err.response?.data?.message || "Failed to update article. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadExisting = async (index, url) => {
        setDownloadingIdx(index);
        try {
            // try public signed url if available (published)
            const { downloadUrl, fileName } = await knowledgeBaseService.getAttachmentDownloadUrl(id, true, index);
            if (downloadUrl) {
                await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
                return;
            }
        } catch {
            // ignore and fallback
        } finally {
            setDownloadingIdx(null);
        }

        // fallback to opening direct URL
        try {
            await downloadFile(url, inferFileNameFromUrl(url));
        } catch {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <section className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="mb-8 flex items-center gap-4">
                <div className="p-3 bg-[#207D86]/10 rounded-xl">
                    <Book className="w-8 h-8 text-[#207D86]" />
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
                        Edit Knowledge Base Article
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">
                        Update article content, metadata, and attachments.
                    </p>
                </div>
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
                        <p className="text-slate-500 font-medium animate-pulse">Loading article details...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            
                            {/* Title Input */}
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-bold text-slate-700">
                                    Article Title <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <Type className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="title"
                                        name="title"
                                        type="text"
                                        value={form.title}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200"
                                        placeholder="e.g., Guide to Effective Handwashing"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Category Grid */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                {/* Standard Category */}
                                <div className="space-y-2">
                                    <label htmlFor="category" className="text-sm font-bold text-slate-700">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                            <FolderTree className="w-5 h-5" />
                                        </div>
                                        <select
                                            id="category"
                                            name="category"
                                            value={form.category}
                                            onChange={handleChange}
                                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 appearance-none"
                                        >
                                            {KB_CATEGORIES.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                            <option value="Other">Other (Custom)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Custom Category (Conditional) */}
                                {form.category === "Other" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label htmlFor="customCategory" className="text-sm font-bold text-slate-700">
                                            Specify Category <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                                <Tag className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="customCategory"
                                                name="customCategory"
                                                type="text"
                                                value={form.customCategory}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-3 bg-white border border-[#207D86]/30 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 shadow-sm shadow-[#207D86]/5"
                                                placeholder="e.g., Emergency Protocols"
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Content Textarea */}
                            <div className="space-y-2">
                                <label htmlFor="content" className="text-sm font-bold text-slate-700">
                                    Article Content <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <AlignLeft className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        id="content"
                                        name="content"
                                        rows={10}
                                        value={form.content}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 min-h-[150px] resize-y"
                                        placeholder="Write the full content of the article here..."
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Media Upload & Settings Section */}
                        <div className="space-y-6 pt-6 border-t border-slate-100">
                            
                            {/* Existing & New Attachments UI */}
                            <div className="space-y-4 border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                                
                                {/* New Files Input */}
                                <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
                                    <div>
                                        <label htmlFor="attachment" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <UploadCloud className="w-5 h-5 text-slate-500" />
                                            Replace Attachments <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                                            Uploading new files will <span className="font-semibold text-amber-600">completely replace</span> all existing attachments. Max 5 files.
                                        </p>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 transition-all shadow-sm"
                                    >
                                        Browse New Files
                                    </button>
                                    {/* Hidden Native Input */}
                                    <input
                                        ref={fileRef}
                                        id="attachment"
                                        name="attachment"
                                        type="file"
                                        accept="image/*,video/*,.pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        multiple
                                        className="hidden"
                                    />
                                </div>

                                {/* Preview Lists Container */}
                                <div className="space-y-5">
                                    
                                    {/* NEW Files Preview (Shows only if new files selected) */}
                                    {newPreviews && newPreviews.length > 0 && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded">New Selection (Will Overwrite)</span>
                                                <span className="text-xs font-semibold text-slate-500">{newPreviews.length}/5 files</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {newPreviews.map((p, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg p-2.5 shadow-sm group">
                                                        <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                                                            {p.type && p.type.startsWith("image/") ? (
                                                                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                getFileIcon(p.type, p.name)
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-700 truncate" title={p.name}>{p.name}</p>
                                                            <p className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">
                                                                {p.type ? p.type.split('/')[1] || p.type : p.name.split('.').pop()}
                                                            </p>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeNewFileAt(idx)} 
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Remove attachment"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* EXISTING Files Preview */}
                                    <div className={newPreviews && newPreviews.length > 0 ? "opacity-40 grayscale-[50%] transition-all" : ""}>
                                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 block">
                                            {newPreviews && newPreviews.length > 0 ? "Existing Files (Will Be Deleted)" : "Currently Attached Files"}
                                        </span>
                                        {existingPreviews.length ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {existingPreviews.map((p, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm group">
                                                        <div className="shrink-0 w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200">
                                                            <Paperclip className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-700 truncate" title={p.name}>{p.name || "Attachment"}</p>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleDownloadExisting(idx, p.url)} 
                                                            disabled={downloadingIdx === idx}
                                                            className="p-1.5 text-[#207D86] hover:bg-[#207D86]/10 rounded-md transition-colors disabled:opacity-50"
                                                            title="Download File"
                                                        >
                                                            {downloadingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center p-4 bg-white border border-dashed border-slate-300 rounded-lg text-slate-400 text-sm font-medium">
                                                No files currently attached.
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Publish Status Toggle */}
                            <div className="flex items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                                    <input 
                                        id="isPublished" 
                                        name="isPublished" 
                                        type="checkbox" 
                                        checked={form.isPublished} 
                                        onChange={handleChange} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-12 h-6 bg-slate-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-[#207D86]/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#207D86]"></div>
                                </label>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        Publish Article
                                    </div>
                                    <p className={`text-xs mt-0.5 font-medium transition-colors ${form.isPublished ? "text-[#207D86]" : "text-slate-500"}`}>
                                        {form.isPublished 
                                            ? "Visible: Anyone with access to the Knowledge Base can see this." 
                                            : "Draft: Only you and admins can see this until published."}
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate("/teacher/knowledge-base/manage")}
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

export default KnowledgeBaseEdit;