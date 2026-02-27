import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import assignmentService from "../../../services/AssignmentService";
import moduleService from "../../../services/ModuleService";

const initialForm = {
  title: "",
  description: "",
  module: "",
  dueDate: "",
  materialUrl: "",
};

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
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
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to download file");
  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName || inferFileNameFromUrl(url) || "material";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const AssignmentsEdit = () => {
  const { id } = useParams();
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
    const loadData = async () => {
      try {
        setError("");
        const [assignment, moduleData] = await Promise.all([
          assignmentService.getAssignmentById(id),
          moduleService.getAllModules(),
        ]);

        setModules(Array.isArray(moduleData) ? moduleData : []);
        setFormData({
          title: assignment?.title || "",
          description: assignment?.description || "",
          module: assignment?.module?._id || "",
          dueDate: toDateTimeLocalValue(assignment?.dueDate),
          materialUrl: assignment?.materialUrl || "",
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load assignment");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownloadMaterial = async () => {
    if (!id || !formData.materialUrl) return;
    try {
      setError("");
      const { downloadUrl, fileName } = await assignmentService.getMaterialDownloadUrl(id);
      await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
    } catch {
      setError("Failed to download assignment material");
    }
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

      await assignmentService.updateAssignment(id, payload);
      navigate("/teacher/assignments/manage");
    } catch (err) {
      const firstValidationMessage = err?.response?.data?.errors?.[0]?.message;
      setError(firstValidationMessage || err?.response?.data?.message || "Failed to update assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Edit Assignment</h2>
        <p className="text-slate-600 mt-1">Update assignment details and attached material.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-600">Loading assignment...</div>
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
                  <option key={item._id} value={item._id}>{item.name}</option>
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
              <label htmlFor="material" className="block text-sm font-semibold text-slate-700 mb-1">Replace Material (optional)</label>
              <input
                id="material"
                name="material"
                type="file"
                accept=".pdf,.doc,.docx,.zip,.txt,image/*"
                onChange={(event) => setMaterialFile(event.target.files?.[0] || null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
              />
              {formData.materialUrl ? (
                <button
                  type="button"
                  onClick={handleDownloadMaterial}
                  className="inline-flex mt-2 text-sm text-[#207D86] font-semibold hover:text-[#14555B]"
                >
                  Download current material
                </button>
              ) : null}
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
              {isSubmitting ? "Saving..." : "Update Assignment"}
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

export default AssignmentsEdit;
