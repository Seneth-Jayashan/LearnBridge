import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import levelService from "../../../services/LevelService";

const LevelManage = () => {
	const navigate = useNavigate();
	const { isSuperAdmin } = useAuth();
	const [levels, setLevels] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncingDefaults, setIsSyncingDefaults] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const loadLevels = async () => {
		try {
			setError("");
			const data = await levelService.getAllLevels();
			setLevels(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to load levels");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadLevels();
	}, []);

	const handleDelete = async (id) => {
		const confirmed = window.confirm("Delete this level?");
		if (!confirmed) return;

		setError("");
		setSuccess("");

		try {
			await levelService.deleteLevel(id);
			await loadLevels();
			setSuccess("Level deleted successfully");
		} catch (err) {
			setError(err.response?.data?.message || "Failed to delete level");
		}
	};

	const handleSyncDefaults = async () => {
		setIsSyncingDefaults(true);
		setError("");
		setSuccess("");

		try {
			const result = await levelService.syncDefaultLevels();
			await loadLevels();
			setSuccess(
				result?.message ||
					`Default levels synced successfully (Created: ${result?.created || 0}, Updated: ${result?.updated || 0})`,
			);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to sync default levels");
		} finally {
			setIsSyncingDefaults(false);
		}
	};

	return (
		<section className="max-w-6xl mx-auto space-y-6">
			<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
				<div>
					<h2 className="text-2xl font-bold text-[#0E2A47]">Manage Levels</h2>
					<p className="text-slate-600 mt-1">Create, update, delete, and sync default education levels.</p>
				</div>

				<div className="flex items-center gap-2">
					{isSuperAdmin && (
						<>
							<button
								type="button"
								onClick={() => navigate("/admin/levels/add")}
								className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B]"
							>
								Add New Level
							</button>

							<button
								type="button"
								onClick={async () => {
									const ok = window.confirm(
										"Restore system default levels? This will add any missing default levels.",
									);
									if (!ok) return;
									await handleSyncDefaults();
								}}
								disabled={isSyncingDefaults}
								className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
							>
								{isSyncingDefaults ? "Syncing..." : "Sync Default Levels"}
							</button>
						</>
					)}
				</div>
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
				<h3 className="text-lg font-semibold text-[#0E2A47] mb-4">All Levels</h3>

				{isLoading ? (
					<p className="text-slate-600">Loading levels...</p>
				) : levels.length === 0 ? (
					<p className="text-slate-600">No levels found. Create your first level.</p>
				) : (
					<div className="space-y-3">
						{levels.map((item) => (
							<article key={item._id} className="border border-slate-200 rounded-lg p-4">
								<div className="flex items-start justify-between gap-4">
									<div>
										<h4 className="font-semibold text-[#0E2A47]">{item.name}</h4>
										{item.description && <p className="text-sm text-slate-700 mt-1">{item.description}</p>}
									</div>

										<div className="flex items-center gap-2">
											{isSuperAdmin ? (
												<>
													<button
														type="button"
														onClick={() => navigate(`/admin/levels/edit/${item._id}`)}
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
												</>
											) : (
												<span className="text-sm text-slate-500">Read only</span>
											)}
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

export default LevelManage;
