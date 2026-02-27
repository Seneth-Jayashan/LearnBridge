import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

const KnowledgeBaseAdd = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [attachment, setAttachment] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (event) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    const maxFiles = 5;
    const existing = Array.isArray(attachment) ? attachment : [];
    // combine existing + newly selected, then cap to maxFiles
    const combined = existing.concat(files).slice(0, maxFiles);

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

  const fileInputRef = useRef(null);

  // revoke object URLs when previews change or on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => { try { URL.revokeObjectURL(p.url); } catch {} });
    };
  }, [previews]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) return setError("Title is required");
    if (!formData.content.trim()) return setError("Content is required");

    try {
      setIsSubmitting(true);
      setError("");
      const categoryToSend = formData.category === "Other" ? (formData.customCategory?.trim() || "") : formData.category;
      await knowledgeBaseService.createEntry({ ...formData, category: categoryToSend, attachment });
      navigate("/teacher/knowledge-base/manage");
    } catch (err) {
      const firstValidationMessage = err.response?.data?.errors?.[0]?.message;
      setError(firstValidationMessage || err.response?.data?.message || "Failed to save article");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Add Knowledge Base Article</h2>
        <p className="text-slate-600 mt-1">Create a guide that can be shared publicly.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            >
              {KB_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.category === "Other" && (
            <div className="md:col-span-2">
              <label htmlFor="customCategory" className="block text-sm font-semibold text-slate-700 mb-1">Specify Category</label>
              <input
                id="customCategory"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleInputChange}
                placeholder="Enter custom category"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-1">Content</label>
            <textarea
              id="content"
              name="content"
              rows={8}
              value={formData.content}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="attachment" className="block text-sm font-semibold text-slate-700 mb-1">Upload Attachment (Image / Video / PDF / Word)</label>
            <input
              ref={fileInputRef}
              id="attachment"
              name="attachment"
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              multiple
              className="w-full"
            />
            {attachment && (
              <div className="mt-2">
                <div className="text-sm text-slate-500">Selected ({attachment.length}/5):</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {previews.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 border rounded p-2 bg-slate-50">
                      {p.type && p.type.startsWith("image/") ? (
                        <img src={p.url} alt={p.name} className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-white border rounded text-xs px-2">{(p.name || "").split('.').pop()?.toUpperCase() || "FILE"}</div>
                      )}
                      <div className="text-sm text-slate-700 max-w-[220px] truncate">{p.name}</div>
                      <button type="button" onClick={() => removeAttachmentAt(idx)} className="ml-2 text-red-500 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="isPublished"
              name="isPublished"
              type="checkbox"
              checked={formData.isPublished}
              onChange={handleInputChange}
            />
            <label htmlFor="isPublished" className="text-sm text-slate-700">Publish now (visible to everyone)</label>
          </div>
        </div>

          <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B] disabled:opacity-60">
            {isSubmitting ? "Saving..." : "Save Article"}
          </button>
      </form>
    </section>
  );
};

export default KnowledgeBaseAdd;
