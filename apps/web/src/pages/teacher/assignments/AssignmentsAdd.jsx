import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import assignmentService from "../../../services/AssignmentService";
import moduleService from "../../../services/ModuleService";

const initialForm = {
  title: "",
  description: "",
  module: "",
  dueDate: "",
};

const AssignmentsAdd = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [materialFile, setMaterialFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedModule = useMemo(() => {
    if (!formData.module) return null;
    return modules.find((item) => String(item._id) === String(formData.module)) || null;
  }, [modules, formData.module]);

  useEffect(() => {
    const loadModules = async () => {
      try {
        setError("");
        const moduleData = await moduleService.getAllModules();
        setModules(Array.isArray(moduleData) ? moduleData : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load modules");
      } finally {
        setIsLoading(false);
      }
    };

    loadModules();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) return setError("Assignment title is required");
    if (!formData.module.trim()) return setError("Please select a module");

    try {
      setError("");
      setIsSubmitting(true);

      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("module", formData.module);
      if (formData.dueDate) {
        payload.append("dueDate", new Date(formData.dueDate).toISOString());
      }
      if (materialFile) {
        payload.append("material", materialFile);
      }

      await assignmentService.createAssignment(payload);
      navigate("/teacher/assignments/manage");
    } catch (err) {
      const firstValidationMessage = err?.response?.data?.errors?.[0]?.message;
      setError(firstValidationMessage || err?.response?.data?.message || "Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Add Assignment</h2>
        <p className="text-slate-600 mt-1">Create assignment under a module for students.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-600">Loading modules...</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="module" className="block text-sm font-semibold text-slate-700 mb-1">Module</label>
              <select
                id="module"
                name="module"
                value={formData.module}
                onChange={handleInputChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
              >
                <option value="">Select module</option>
                {modules.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} {item?.grade?.name ? `— ${item.grade.name}` : ""}
                  </option>
                ))}
              </select>
              {selectedModule ? (
                <div className="mt-2 text-xs text-slate-600">
                  <div><span className="font-medium">Grade:</span> {selectedModule?.grade?.name || "N/A"}</div>
                  <div><span className="font-medium">Level:</span> {selectedModule?.level?.name || "N/A"}</div>
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">Assignment Title</label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Complete worksheet 01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
              />
            </div>

            <div>
              <label htmlFor="material" className="block text-sm font-semibold text-slate-700 mb-1">Assignment Material (optional)</label>
              <input
                id="material"
                name="material"
                type="file"
                accept=".pdf,.doc,.docx,.zip,.txt,image/*"
                onChange={(event) => setMaterialFile(event.target.files?.[0] || null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
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
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B] disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Create Assignment"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/teacher/assignments/manage")}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default AssignmentsAdd;
