import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const KnowledgeBaseEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          setError("Article not found");
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
        setError(err.response?.data?.message || "Failed to load article");
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
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const max = 5;
    const selected = files.slice(0, max);
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
    if (!form.title.trim()) return setError("Title is required");
    if (!form.content.trim()) return setError("Content is required");

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
      setError(firstValidationMessage || err.response?.data?.message || "Failed to update article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadExisting = async (index, url) => {
    try {
      // try public signed url if available (published)
      const { downloadUrl, fileName } = await knowledgeBaseService.getAttachmentDownloadUrl(id, true, index);
      if (downloadUrl) {
        await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
        return;
      }
    } catch {
      // ignore
    }

    // fallback to opening direct URL
    try {
      await downloadFile(url, inferFileNameFromUrl(url));
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Edit Knowledge Base Article</h2>
        <p className="text-slate-600 mt-1">Update article and attachments.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-600">Loading article...</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
              <input id="title" name="title" value={form.title} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]" />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]">
                {KB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            {form.category === "Other" && (
              <div className="md:col-span-2">
                <label htmlFor="customCategory" className="block text-sm font-semibold text-slate-700 mb-1">Specify Category</label>
                <input id="customCategory" name="customCategory" value={form.customCategory} onChange={handleChange} placeholder="Enter custom category" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]" />
              </div>
            )}

            <div className="md:col-span-2">
              <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-1">Content</label>
              <textarea id="content" name="content" rows={8} value={form.content} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Replace Attachments (optional - up to 5)</label>
              <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" multiple onChange={handleFileChange} className="w-full" />

              {newPreviews && newPreviews.length ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPreviews.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 border rounded p-2 bg-slate-50">
                      {p.type && p.type.startsWith("image/") ? (
                        <img src={p.url} alt={p.name} className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-white border rounded text-xs px-2">{(p.name || "").split('.').pop()?.toUpperCase() || "FILE"}</div>
                      )}
                      <div className="text-sm text-slate-700 max-w-[220px] truncate">{p.name}</div>
                      <button type="button" onClick={() => removeNewFileAt(idx)} className="ml-2 text-red-500 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-3">
                <div className="text-sm font-semibold text-slate-700">Existing Attachments</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {existingPreviews.length ? existingPreviews.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 border rounded p-2 bg-white">
                      <div className="text-sm text-slate-700 max-w-[220px] truncate">{p.name}</div>
                      <button type="button" onClick={() => handleDownloadExisting(idx, p.url)} className="ml-2 text-[#207D86] text-sm">Download</button>
                    </div>
                  )) : (
                    <div className="text-sm text-slate-500">No attachments</div>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-2">Note: uploading new files replaces existing attachments.</div>
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input id="isPublished" name="isPublished" type="checkbox" checked={form.isPublished} onChange={handleChange} />
              <label htmlFor="isPublished" className="text-sm text-slate-700">Publish now (visible to everyone)</label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B] disabled:opacity-60">{isSubmitting ? "Saving..." : "Update Article"}</button>
            <button type="button" onClick={() => navigate("/teacher/knowledge-base/manage")} className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
};

export default KnowledgeBaseEdit;
