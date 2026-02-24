import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moduleService from "../../../services/ModuleService";

const ModulesManage = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this module?");
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await moduleService.deleteModule(id);
      await loadModules();
      setSuccess("Module deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete module");
    }
  };

  return (
    <section className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0E2A47]">Manage Modules</h2>
          <p className="text-slate-600 mt-1">Edit and delete existing modules.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/modules/add")}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B]"
        >
          Add New Module
        </button>
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
                    <p className="text-xs text-slate-500 mt-1">
                      Level: {item.level?.name || "-"} • Grade: {item.grade?.name || "-"}
                      {item.subjectStream ? ` • Stream: ${item.subjectStream}` : ""}
                    </p>
                    {item.description && <p className="text-sm text-slate-700 mt-1">{item.description}</p>}
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={`${item.name} thumbnail`}
                        className="mt-2 h-20 w-32 object-cover rounded-md border border-slate-200"
                      />
                    )}
                    {/* Content URL removed */}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/modules/edit/${item._id}`)}
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
