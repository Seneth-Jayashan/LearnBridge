import { useState } from "react";
import { useNavigate } from "react-router-dom";
import levelService from "../../../services/LevelService";

const AddLevels = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({ name: "", description: "" });
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleInputChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!formData.name.trim()) {
			setError("Level name is required");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			await levelService.createLevel({
				name: formData.name.trim(),
				description: formData.description.trim(),
			});
			navigate("/admin/levels/manage");
		} catch (err) {
			setError(err.response?.data?.message || "Failed to create level");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section className="max-w-5xl mx-auto space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-[#0E2A47]">Add Level</h2>
				<p className="text-slate-600 mt-1">Create a new education level.</p>
			</div>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Level Name</label>
						<input
							id="name"
							name="name"
							value={formData.name}
							onChange={handleInputChange}
							className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
							placeholder="Primary Education"
						/>
					</div>

					<div>
						<label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
						<input
							id="description"
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
							placeholder="Grade 1 – 5"
						/>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="submit"
						disabled={isSubmitting}
						className="inline-flex items-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B] disabled:opacity-60"
					>
						{isSubmitting ? "Saving..." : "Create Level"}
					</button>
					<button
						type="button"
						onClick={() => navigate("/admin/levels/manage")}
						className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
					>
						Cancel
					</button>
				</div>
			</form>
		</section>
	);
};

export default AddLevels;
