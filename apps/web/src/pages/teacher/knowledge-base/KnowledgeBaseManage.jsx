import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import knowledgeBaseService from "../../../services/KnowledgeBaseService";

const blankForm = {
  title: "",
  content: "",
  category: "",
  customCategory: "",
  isPublished: false,
};

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

const KnowledgeBaseManage = () => {
  const [entries, setEntries] = useState([]);
  const [editFiles, setEditFiles] = useState(null);
  const [editPreviews, setEditPreviews] = useState([]);
  const editFileRef = useRef(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(blankForm);

  const loadEntries = async (search = "") => {
    try {
      setError("");
      setIsLoading(true);
      const data = await knowledgeBaseService.getAllEntries(search);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEntries(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredEntries = entries;

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditForm({
      title: entry.title || "",
      content: entry.content || "",
      category: KB_CATEGORIES.includes(entry.category) ? entry.category : "Other",
      customCategory: KB_CATEGORIES.includes(entry.category) ? "" : (entry.category || ""),
      isPublished: Boolean(entry.isPublished),
    });
    setEditFiles(null);
    const urls = Array.isArray(entry.attachmentUrls) ? entry.attachmentUrls : (entry.attachmentUrl ? [entry.attachmentUrl] : []);
    const p = urls.map((u) => ({ url: u, name: (u || "").split('/').pop() }));
    setEditPreviews(p);
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const saveEdit = async (id) => {
    if (!editForm.title.trim() || !editForm.content.trim()) return;
    try {
      setError("");
      const payload = {
        ...editForm,
        category: editForm.category === "Other" ? (editForm.customCategory?.trim() || "") : editForm.category,
      };
      if (editFiles && Array.isArray(editFiles) && editFiles.length) {
        payload.attachment = editFiles;
      }
      await knowledgeBaseService.updateEntry(id, payload);
      setEditingId("");
      setEditForm(blankForm);
      setEditFiles(null);
      setEditPreviews([]);
      await loadEntries(query);
    } catch (err) {
      const firstValidationMessage = err.response?.data?.errors?.[0]?.message;
      setError(firstValidationMessage || err.response?.data?.message || "Failed to update entry");
    }
  };

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

  const handleEditFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const maxFiles = 5;
    const selected = files.slice(0, maxFiles);
    setEditFiles(selected);
    const p = selected.map((f) => ({ url: URL.createObjectURL(f), name: f.name, type: f.type }));
    setEditPreviews(p);
    if (editFileRef.current) editFileRef.current.value = "";
  };

  const removeEditFileAt = (idx) => {
    if (!editFiles) return;
    const next = editFiles.slice(0, idx).concat(editFiles.slice(idx + 1));
    setEditFiles(next.length ? next : null);
    try { URL.revokeObjectURL(editPreviews[idx]?.url); } catch {}
    setEditPreviews(editPreviews.slice(0, idx).concat(editPreviews.slice(idx + 1)));
  };

  // cleanup created object URLs for edit previews
  useEffect(() => {
    return () => {
      editPreviews.forEach((p) => { try { URL.revokeObjectURL(p.url); } catch {} });
    };
  }, [editPreviews]);

  const handleDelete = async (id) => {
    const shouldDelete = window.confirm("Delete this article?");
    if (!shouldDelete) return;
    try {
      setError("");
      await knowledgeBaseService.deleteEntry(id);
      await loadEntries(query);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete entry");
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
      setError(err.response?.data?.message || "Failed to update publish status");
    }
  };

  return (
    <section className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-[#0E2A47]">Manage Knowledge Base</h2>
          <p className="text-slate-600 mt-1">Edit, publish, and remove teacher articles.</p>
        </div>
        <Link to="/teacher/knowledge-base/add" className="inline-flex items-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B]">
          Add Article
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your articles"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading entries...
        </div>
      ) : !filteredEntries.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No knowledge base entries found.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEntries.map((entry) => (
            <article key={entry.id} className="bg-white border border-slate-200 rounded-xl p-5">
              {editingId === entry.id ? (
                <div className="space-y-3">
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <select
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  >
                    {KB_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>

                  {editForm.category === "Other" && (
                    <input
                      name="customCategory"
                      value={editForm.customCategory}
                      onChange={handleEditChange}
                      placeholder="Specify category"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 mt-2"
                    />
                  )}
                  <textarea
                    name="content"
                    rows={5}
                    value={editForm.content}
                    onChange={handleEditChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Replace Attachments (optional - up to 5)</label>
                    <input
                      ref={editFileRef}
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      multiple
                      onChange={handleEditFileChange}
                      className="w-full"
                    />
                    {editPreviews && editPreviews.length ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editPreviews.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-3 border rounded p-2 bg-slate-50">
                            {p.type && p.type.startsWith("image/") ? (
                              <img src={p.url} alt={p.name} className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-16 flex items-center justify-center bg-white border rounded text-xs px-2">{(p.name || "").split('.').pop()?.toUpperCase() || "FILE"}</div>
                            )}
                            <div className="text-sm text-slate-700 max-w-[220px] truncate">{p.name}</div>
                            <button type="button" onClick={() => removeEditFileAt(idx)} className="ml-2 text-red-500 text-sm">Remove</button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="text-xs text-slate-500 mt-2">Note: uploading new files replaces existing attachments.</div>
                  </div>
                  
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      name="isPublished"
                      type="checkbox"
                      checked={editForm.isPublished}
                      onChange={handleEditChange}
                    />
                    Published
                  </label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => saveEdit(entry.id)} className="px-3 py-1.5 rounded-lg bg-[#207D86] text-white text-sm font-semibold">
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId("");
                        setEditForm(blankForm);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-[#0E2A47]">{entry.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${entry.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {entry.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-slate-700 whitespace-pre-line">{entry.content}</p>
                  {Array.isArray(entry.attachmentUrls) && entry.attachmentUrls.length ? (
                    <div className="mt-3 flex flex-wrap gap-3 items-center">
                      {entry.attachmentUrls.map((a, i) => (
                        <button
                          key={i}
                          onClick={async () => {
                            try {
                              const { downloadUrl, fileName } = await knowledgeBaseService.getAttachmentDownloadUrl(entry.id, true, i);
                              if (downloadUrl) {
                                await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
                                return;
                              }
                              const url = toPublicMediaUrl(a);
                              await downloadFile(url, inferFileNameFromUrl(url));
                            } catch (err) {
                              window.open(a, "_blank", "noopener,noreferrer");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-[#207D86]"
                        >
                          Attachment {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 text-xs text-slate-500">
                    Updated {new Date(entry.updatedAt).toLocaleString()}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => navigate(`/teacher/knowledge-base/edit/${entry.id}`)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold">
                      Edit
                    </button>
                    <button onClick={() => togglePublished(entry)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold">
                      {entry.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-sm font-semibold">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default KnowledgeBaseManage;
