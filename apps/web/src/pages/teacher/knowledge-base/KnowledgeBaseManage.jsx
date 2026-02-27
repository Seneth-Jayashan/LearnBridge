import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import knowledgeBaseService from "../../../services/KnowledgeBaseService";

const blankForm = {
  title: "",
  summary: "",
  content: "",
  category: "",
  isPublished: false,
};

const KnowledgeBaseManage = () => {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState("");
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
      summary: entry.summary || "",
      content: entry.content || "",
      category: entry.category || "",
      isPublished: Boolean(entry.isPublished),
    });
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const saveEdit = async (id) => {
    if (!editForm.title.trim() || !editForm.content.trim()) return;
    try {
      setError("");
      await knowledgeBaseService.updateEntry(id, editForm);
      setEditingId("");
      setEditForm(blankForm);
      await loadEntries(query);
    } catch (err) {
      const firstValidationMessage = err.response?.data?.errors?.[0]?.message;
      setError(firstValidationMessage || err.response?.data?.message || "Failed to update entry");
    }
  };

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
                  <input
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <textarea
                    name="summary"
                    rows={2}
                    value={editForm.summary}
                    onChange={handleEditChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <textarea
                    name="content"
                    rows={5}
                    value={editForm.content}
                    onChange={handleEditChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                  
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
                  {entry.summary && <p className="mt-2 text-slate-600">{entry.summary}</p>}
                  <p className="mt-2 text-slate-700 whitespace-pre-line">{entry.content}</p>
                  <div className="mt-3 text-xs text-slate-500">
                    Updated {new Date(entry.updatedAt).toLocaleString()}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => startEditing(entry)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold">
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
