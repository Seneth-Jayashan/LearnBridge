import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import gradeService from "../../../services/GradeService";

const GradeManage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadGrades = async () => {
    try {
      setError("");
      const data = await gradeService.getAllGrades();
      setGrades(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load grades");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this grade?");
    if (!ok) return;
    try {
      setError("");
      await gradeService.deleteGrade(id);
      await loadGrades();
      setSuccess("Grade deleted");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete grade");
    }
  };

  const handleSync = async () => {
    const ok = window.confirm("Restore system default grades (1-13)?");
    if (!ok) return;
    setIsSyncing(true);
    setError("");
    setSuccess("");
    try {
      const res = await gradeService.syncDefaultGrades();
      await loadGrades();
      setSuccess(res?.message || "Default grades synced");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sync defaults");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0E2A47]">Manage Grades</h2>
          <p className="text-slate-600 mt-1">Create, edit, delete, and sync system grades (1-13).</p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <>
              <button onClick={() => navigate("/admin/grades/add")} className="px-4 py-2 rounded bg-[#207D86] text-white">Add Grade</button>
              <button onClick={handleSync} disabled={isSyncing} className="px-4 py-2 rounded border">{isSyncing ? "Syncing..." : "Sync Default Grades"}</button>
            </>
          )}
        </div>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="bg-white border rounded p-5">
        <h3 className="text-lg font-semibold mb-4">All Grades</h3>
        {isLoading ? (
          <p>Loading grades...</p>
        ) : grades.length === 0 ? (
          <p>No grades found.</p>
        ) : (
          <div className="space-y-3">
            {grades.map((g) => (
              <div key={g._id} className="flex items-center justify-between border p-3 rounded">
                <div>
                  <div className="font-semibold">{g.name}</div>
                  {g.description && <div className="text-sm text-slate-600">{g.description}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {isSuperAdmin ? (
                    <>
                      <button onClick={() => navigate(`/admin/grades/edit/${g._id}`)} className="px-3 py-1 border rounded">Edit</button>
                      <button onClick={() => handleDelete(g._id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">Read only</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default GradeManage;
