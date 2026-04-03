import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Book, 
    Type, 
    AlignLeft, 
    FolderTree, 
    Tag, 
    AlertCircle, 
    Loader2, 
    CheckCircle2, 
    X,
    UploadCloud,
    FileText,
    Image as ImageIcon,
    Video,
    File as FileIcon
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
    isPublished: true,
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

const KnowledgeBaseAdd = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialForm);
    const [attachment, setAttachment] = useState(null);
    const [previews, setPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        if (error) setError(""); // Clear error to improve UX
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleFileChange = (event) => {
        if (error) setError("");
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (!files.length) return;

        const maxFiles = 5;
        const existing = Array.isArray(attachment) ? attachment : [];
        
        // combine existing + newly selected, then cap to maxFiles
        const combined = existing.concat(files).slice(0, maxFiles);

        if (existing.length + files.length > maxFiles) {
            setError(`You can only upload a maximum of ${maxFiles} files. Additional files were ignored.`);
        }

        // revoke previous preview URLs
        previews.forEach((p) => { try { URL.revokeObjectURL(p.url); } catch {} });

        const newPreviews = combined.map((f) => ({ url: URL.createObjectURL(f), type: f.type, name: f.name }));
        setPreviews(newPreviews);
        setAttachment(combined.length ? combined : null);

        // clear native input so same file can be re-selected later
        try { if (fileInputRef.current) fileInputRef.current.value = ""; } catch {}
    };

    const removeAttachmentAt = (index) => {
        if (!attachment || !Array.isArray(attachment)) return;
        const nextFiles = attachment.slice(0, index).concat(attachment.slice(index + 1));
        
        // revoke this preview
        try { URL.revokeObjectURL(previews[index]?.url); } catch {}
        
        const nextPreviews = previews.slice(0, index).concat(previews.slice(index + 1));
        setAttachment(nextFiles.length ? nextFiles : null);
        setPreviews(nextPreviews);
    };

    // revoke object URLs when previews change or on unmount
    useEffect(() => {
        return () => {
            previews.forEach((p) => { try { URL.revokeObjectURL(p.url); } catch {} });
        };
    }, [previews]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!formData.title.trim()) return setError("Article title is required.");
        if (!formData.content.trim()) return setError("Article content is required.");
        if (formData.category === "Other" && !formData.customCategory.trim()) {
            return setError("Please specify the custom category name.");
        }

        try {
            setIsSubmitting(true);
            setError("");
            
            const categoryToSend = formData.category === "Other" ? (formData.customCategory?.trim() || "") : formData.category;
            
            await knowledgeBaseService.createEntry({ ...formData, category: categoryToSend, attachment });
            navigate("/teacher/knowledge-base/manage");
        } catch (err) {
            const firstValidationMessage = err.response?.data?.errors?.[0]?.message;
            setError(firstValidationMessage || err.response?.data?.message || "Failed to save article. Please try again.");
        } finally {
            setIsSubmitting(false);
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
                        Add Knowledge Base Article
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">
                        Create a new guide, resource, or informational article to share.
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
                                    value={formData.title}
                                    onChange={handleInputChange}
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
                                        value={formData.category}
                                        onChange={handleInputChange}
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
                            {formData.category === "Other" && (
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
                                            value={formData.customCategory}
                                            onChange={handleInputChange}
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
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 min-h-[150px] resize-y"
                                    placeholder="Write the full content of the article here..."
                                />
                            </div>
                        </div>

                    </div>

                    {/* Media Upload & Settings Section */}
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        
                        {/* Custom File Upload UI */}
                        <div className="space-y-3 border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="attachment" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <UploadCloud className="w-5 h-5 text-slate-500" />
                                        Attachments <span className="text-slate-400 font-normal">(Optional)</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Upload up to 5 files (Images, Videos, PDFs, Word docs)
                                    </p>
                                </div>
                                
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={attachment?.length >= 5}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Browse Files
                                </button>
                                {/* Hidden Native Input */}
                                <input
                                    ref={fileInputRef}
                                    id="attachment"
                                    name="attachment"
                                    type="file"
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    multiple
                                    className="hidden"
                                />
                            </div>

                            {/* Preview List */}
                            {attachment && attachment.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                        <span>Selected Files ({attachment.length}/5)</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {previews.map((p, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm group animate-in fade-in slide-in-from-bottom-1">
                                                
                                                {/* File Icon/Thumbnail */}
                                                <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    {p.type && p.type.startsWith("image/") ? (
                                                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        getFileIcon(p.type, p.name)
                                                    )}
                                                </div>
                                                
                                                {/* File Name */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-700 truncate" title={p.name}>
                                                        {p.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">
                                                        {p.type ? p.type.split('/')[1] || p.type : p.name.split('.').pop()}
                                                    </p>
                                                </div>
                                                
                                                {/* Remove Button */}
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeAttachmentAt(idx)} 
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors focus:outline-none"
                                                    title="Remove attachment"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Publish Status Toggle */}
                        <div className="flex items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                                <input 
                                    id="isPublished" 
                                    name="isPublished" 
                                    type="checkbox" 
                                    checked={formData.isPublished} 
                                    onChange={handleInputChange} 
                                    className="sr-only peer" 
                                />
                                <div className="w-12 h-6 bg-slate-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-[#207D86]/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#207D86]"></div>
                            </label>
                            <div>
                                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    Publish Article Immediately
                                </div>
                                <p className={`text-xs mt-0.5 font-medium transition-colors ${formData.isPublished ? "text-[#207D86]" : "text-slate-500"}`}>
                                    {formData.isPublished 
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
                                    <CheckCircle2 className="w-5 h-5" />
                                    Save Article
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default KnowledgeBaseAdd;