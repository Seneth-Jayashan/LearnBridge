import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import gradeService from "../../../services/GradeService";

const EditGrade = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const g = await gradeService.getGradeById(id);
        setForm({ name: g.name || "", description: g.description || "" });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load grade");
      } finally { setIsLoading(false); }
    };
    load();
  }, [id]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Grade name is required");
    setIsSubmitting(true);
    try {
      await gradeService.updateGrade(id, { name: form.name.trim(), description: form.description.trim() });
      navigate('/admin/grades/manage');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update grade');
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div>Loading grade...</div>;

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Edit Grade</h2>
      {error && <div className="text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white border p-5 rounded">
        <div className="grid gap-3">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input name="description" value={form.description} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#207D86] text-white rounded" disabled={isSubmitting}>{isSubmitting?"Saving...":"Update"}</button>
            <button type="button" onClick={() => navigate('/admin/grades/manage')} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default EditGrade;
