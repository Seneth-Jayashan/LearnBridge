import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    BookOpen, 
    AlignLeft, 
    AlertCircle, 
    Loader2, 
    CheckCircle2, 
    X 
} from "lucide-react";
import levelService from "../../../services/LevelService";

const AddLevels = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing to improve UX
        if (error) setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!formData.name.trim()) {
            setError("Level name is required to continue.");
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
            setError(err.response?.data?.message || "Failed to create level. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
                    Add New Level
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Create and configure a new education level for the system.
                </p>
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                    <div className="space-y-6">
                        {/* Level Name Input */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-bold text-slate-700">
                                Level Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200"
                                    placeholder="e.g., Primary Education"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Description Input */}
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-bold text-slate-700">
                                Description <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                    <AlignLeft className="w-5 h-5" />
                                </div>
                                <input
                                    id="description"
                                    name="description"
                                    type="text"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200"
                                    placeholder="e.g., Covers Grade 1 through Grade 5"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/levels/manage")}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all active:scale-[0.98]"
                        >
                            <X className="w-5 h-5" />
                            Cancel
                        </button>
                        
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto sm:ml-auto inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Create Level
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default AddLevels;