import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { 
    Plus, 
    RefreshCw, 
    Trash2, 
    Edit2, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    BookOpen,
    Shield
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import levelService from "../../../services/LevelService";

// Initialize the React-friendly SweetAlert instance
const MySwal = withReactContent(Swal);

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
            setError(err.response?.data?.message || "Failed to load levels.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLevels();
    }, []);

    const handleDelete = async (id) => {
        // Replaced window.confirm with SweetAlert2
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this! This action will delete the level permanently.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626", // Tailwind red-600
            cancelButtonColor: "#94a3b8",  // Tailwind slate-400
            confirmButtonText: "Yes, delete it!",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all",
                cancelButton: "px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
            }
        });

        if (!result.isConfirmed) return;

        setError("");
        setSuccess("");

        try {
            await levelService.deleteLevel(id);
            await loadLevels();
            setSuccess("Level deleted successfully.");
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);
            
            // Optional: Show a quick success toast
            MySwal.fire({
                title: "Deleted!",
                text: "The level has been removed.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete level.");
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
                `Default levels synced successfully (Created: ${result?.created || 0}, Updated: ${result?.updated || 0}).`
            );
            
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to sync default levels.");
        } finally {
            setIsSyncingDefaults(false);
        }
    };

    const promptSyncDefaults = async () => {
        // Replaced window.confirm with SweetAlert2
        const result = await MySwal.fire({
            title: "Restore Default Levels?",
            text: "This will add any missing system default levels to your database.",
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#207D86", // Your theme color
            cancelButtonColor: "#94a3b8",  // Tailwind slate-400
            confirmButtonText: "Yes, sync them!",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all",
                cancelButton: "px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
            }
        });

        if (result.isConfirmed) {
            await handleSyncDefaults();
        }
    };

    return (
        <section className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">Manage Levels</h2>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        Create, update, delete, and sync default education levels.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isSuperAdmin && (
                        <>
                            <button
                                type="button"
                                onClick={promptSyncDefaults}
                                disabled={isSyncingDefaults}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSyncingDefaults ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 text-slate-500" />
                                )}
                                {isSyncingDefaults ? "Syncing..." : "Sync Defaults"}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/admin/levels/add")}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98]"
                            >
                                <Plus className="w-5 h-5" />
                                Add Level
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Notification Banners */}
            <div className="space-y-3 mb-6">
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-3 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-start gap-3 animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-emerald-800">{success}</p>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#207D86]" />
                        All Education Levels
                    </h3>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-slate-50 rounded-full">
                                <Loader2 className="w-8 h-8 text-[#207D86] animate-spin" />
                            </div>
                            <p className="text-slate-500 font-medium animate-pulse">Loading levels...</p>
                        </div>
                    ) : levels.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                <BookOpen className="w-8 h-8 text-slate-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-700 mb-1">No levels found</h4>
                            <p className="text-slate-500 max-w-sm">
                                It looks like you haven't created any education levels yet. 
                                {isSuperAdmin ? " Click 'Add Level' to get started." : ""}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {levels.map((item) => (
                                <article 
                                    key={item._id} 
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:border-[#207D86]/30 hover:shadow-md hover:shadow-[#207D86]/5 transition-all duration-200"
                                >
                                    <div className="flex-1">
                                        <h4 className="text-base font-bold text-slate-800 group-hover:text-[#207D86] transition-colors">
                                            {item.name}
                                        </h4>
                                        {item.description ? (
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                {item.description}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic mt-1">
                                                No description provided
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                        {isSuperAdmin ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/admin/levels/edit/${item._id}`)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item._id)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-500 font-medium">
                                                <Shield className="w-4 h-4" />
                                                Read only
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default LevelManage;