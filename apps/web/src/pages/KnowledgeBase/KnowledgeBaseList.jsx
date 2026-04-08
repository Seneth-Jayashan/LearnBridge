import { Link } from "react-router-dom";
import { BookOpen, Calendar, User, ChevronRight, FileSearch } from "lucide-react";

// --- Helpers (Logic unchanged) ---
export const toPublicMediaUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const origin = apiBase.replace(/\/api\/v1\/?$/i, "");
  return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
};

export const inferFileNameFromUrl = (url) => {
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

export const downloadFile = async (url, fileName = "") => {
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

// --- Component (Logic unchanged, UI enhanced) ---
const KnowledgeBaseList = ({ entries, emptyMessage = "No articles available yet." }) => {
  
  // Logic preserved: Empty state check
  if (!entries.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 px-6 flex flex-col items-center justify-center text-center animate-in fade-in">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
          <FileSearch className="w-8 h-8 text-slate-300" />
        </div>
        <h4 className="text-lg font-bold text-slate-700 mb-1">It's quiet here</h4>
        <p className="text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  // Logic preserved: Mapping over entries
  return (
    <div className="grid gap-4">
      {entries.map((entry) => (
        <article 
          key={entry.id} 
          className="group bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#207D86]/30 transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
        >
          {/* Main Info Area */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#207D86]/10 text-[#207D86] text-xs font-bold uppercase tracking-wide">
                <BookOpen className="w-3.5 h-3.5" />
                {entry.category || "General"}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(entry.updatedAt).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-[#0E2A47] group-hover:text-[#207D86] transition-colors mb-3">
              {entry.title}
            </h3>

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <User className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-600">
                By {entry.authorName || "Teacher"}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 sm:pt-0 shrink-0 border-t sm:border-t-0 border-slate-100">
            <Link 
              to={`/knowledge-base/${entry.id}`} 
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-[#207D86]/5 hover:border-[#207D86]/30 text-slate-700 hover:text-[#207D86] font-bold text-sm transition-all"
            >
              Read more <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
};

export default KnowledgeBaseList;