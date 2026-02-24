import { useEffect, useMemo, useState } from "react";
import moduleService from "../../../services/ModuleService";

const initialForm = {
  name: "",
  description: "",
  contentUrl: "",
};

const ModulesManage = () => {
  const [modules, setModules] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submitLabel = useMemo(() => (editingId ? "Update Module" : "Create Module"), [editingId]);

  const loadModules = async () => {
    try {
      setError("");
      const data = await moduleService.getAllModules();
      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load modules");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId("");
  };

  const handleEdit = (item) => {
    setError("");
    setSuccess("");
    setEditingId(item._id);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      contentUrl: item.contentUrl || "",
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this module?");
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await moduleService.deleteModule(id);
      if (editingId === id) {
        resetForm();
      }
      await loadModules();
      setSuccess("Module deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete module");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setError("Module name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      contentUrl: formData.contentUrl.trim(),
    };

    try {
      if (editingId) {
        await moduleService.updateModule(editingId, payload);
        setSuccess("Module updated successfully");
      } else {
        await moduleService.createModule(payload);
        setSuccess("Module created successfully");
      }

      resetForm();
      await loadModules();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save module");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Manage Modules</h2>
        <p className="text-slate-600 mt-1">Create, update, and delete learning modules.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Module Name</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
              placeholder="Algebra Basics"
            />
          </div>

          <div>
            <label htmlFor="contentUrl" className="block text-sm font-semibold text-slate-700 mb-1">Content URL</label>
            <input
              id="contentUrl"
              name="contentUrl"
              value={formData.contentUrl}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
              placeholder="https://example.com/module"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
              placeholder="Short module summary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B] disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[#0E2A47] mb-4">All Modules</h3>

        {isLoading ? (
          <p className="text-slate-600">Loading modules...</p>
        ) : modules.length === 0 ? (
          <p className="text-slate-600">No modules found. Create your first module.</p>
        ) : (
          <div className="space-y-3">
            {modules.map((item) => (
              <article key={item._id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-[#0E2A47]">{item.name}</h4>
                    {item.description && <p className="text-sm text-slate-700 mt-1">{item.description}</p>}
                    {item.contentUrl && (
                      <a
                        href={item.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex mt-2 text-sm font-semibold text-[#207D86] hover:text-[#14555B]"
                      >
                        Open content
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ModulesManage;
