import { useState } from "react";
import { useNavigate } from "react-router-dom";
import knowledgeBaseService from "../../../services/KnowledgeBaseService";

const initialForm = {
  title: "",
  summary: "",
  content: "",
  category: "",
  isPublished: true,
};

const KnowledgeBaseAdd = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setAttachment(file || null);
    // no-op: just set attachment
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) return setError("Title is required");
    if (!formData.content.trim()) return setError("Content is required");

    try {
      setIsSubmitting(true);
      setError("");
      await knowledgeBaseService.createEntry({ ...formData, attachment });
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
            <input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="Example: Student Guide"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="summary" className="block text-sm font-semibold text-slate-700 mb-1">Summary</label>
            <textarea
              id="summary"
              name="summary"
              rows={2}
              value={formData.summary}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
            />
          </div>
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
              id="attachment"
              name="attachment"
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full"
            />
            {attachment && <p className="text-sm text-slate-500 mt-2">Selected: {attachment.name}</p>}
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
