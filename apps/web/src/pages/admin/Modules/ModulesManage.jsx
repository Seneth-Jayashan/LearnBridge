import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Plus, 
    Trash2, 
    Edit2, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    Library,
    Search,
    FilterX,
    Layers,
    GraduationCap,
    Image as ImageIcon
} from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import moduleService from "../../../services/ModuleService";
import gradeService from "../../../services/GradeService";
import levelService from "../../../services/LevelService";
import { parseGradeNumber } from "./moduleFormConfig";

const MySwal = withReactContent(Swal);

const ModulesManage = () => {
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [grades, setGrades] = useState([]);
    const [levels, setLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Filter States
    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const loadModules = async (opts = {}) => {
        try {
            setError("");
            setIsLoading(true);
            const params = {
                q: opts.q !== undefined ? opts.q : searchQuery,
                grade: opts.grade !== undefined ? opts.grade : selectedGrade,
                level: opts.level !== undefined ? opts.level : selectedLevel,
            };
            const data = await moduleService.getAllModules(params);
            setModules(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load modules.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadGradesAndLevels = async () => {
        try {
            const [g, l] = await Promise.all([
                gradeService.getAllGrades(), 
                levelService.getAllLevels()
            ]);
            setGrades(Array.isArray(g) ? g : []);
            setLevels(Array.isArray(l) ? l : []);
        } catch (err) {
            console.error("Failed to load grades/levels", err);
        }
    };

    useEffect(() => {
        loadModules();
        loadGradesAndLevels();
    }, []);

    // Debounced Search and Filter trigger
    useEffect(() => {
        const t = setTimeout(() => loadModules(), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, selectedGrade, selectedLevel]);

    const handleDelete = async (id) => {
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this! This action will delete the module permanently.",
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
            await moduleService.deleteModule(id);
            await loadModules();
            setSuccess("Module deleted successfully.");
            
            setTimeout(() => setSuccess(""), 3000);
            
            MySwal.fire({
                title: "Deleted!",
                text: "The module has been removed.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete module.");
        }
    };

    const clearFilters = () => {
        setSelectedGrade("");
        setSelectedLevel("");
        setSearchQuery("");
    };

    const filteredModules = modules.filter((item) => {
        if (selectedLevel && item.level?._id !== selectedLevel) return false;
        if (selectedGrade && item.grade?._id !== selectedGrade) return false;
        return true;
    });

    return (
        <section className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">Manage Modules</h2>
                    <p className="text-slate-500 mt-2 text-sm md:text-base">
                        View, search, edit, and organize all educational modules.
                    </p>
                </div>

                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/modules/add")}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98] w-full md:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Add Module
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 mb-6 flex flex-col lg:flex-row gap-4 items-center z-10 relative">
                
                {/* Search Input */}
                <div className="relative w-full lg:max-w-sm group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="flex w-full lg:w-auto gap-3 flex-col sm:flex-row">
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                    >
                        <option value="">All Levels</option>
                        {levels.map((lv) => (
                            <option key={lv._id} value={lv._id}>{lv.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                    >
                        <option value="">All Grades</option>
                        {grades.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                    </select>

                    {(searchQuery || selectedGrade || selectedLevel) && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shrink-0"
                            title="Clear all filters"
                        >
                            <FilterX className="w-4 h-4" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
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
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden min-h-[400px]">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Library className="w-5 h-5 text-[#207D86]" />
                        Modules Database
                    </h3>
                    {!isLoading && (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-[#207D86]/10 text-[#207D86] rounded-full">
                            {filteredModules.length} found
                        </span>
                    )}
                </div>

                <div className="p-6 bg-slate-50/30">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
                                <Loader2 className="w-8 h-8 text-[#207D86] animate-spin" />
                            </div>
                            <p className="text-slate-500 font-medium animate-pulse">Fetching modules...</p>
                        </div>
                    ) : filteredModules.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                                <Library className="w-10 h-10 text-slate-300" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-700 mb-2">No modules found</h4>
                            <p className="text-slate-500 max-w-md">
                                {(searchQuery || selectedGrade || selectedLevel) 
                                    ? "We couldn't find any modules matching your current filters. Try adjusting your search." 
                                    : "It looks like you haven't created any educational modules yet. Click 'Add Module' to begin."}
                            </p>
                            {(searchQuery || selectedGrade || selectedLevel) && (
                                <button 
                                    onClick={clearFilters}
                                    className="mt-4 text-sm font-semibold text-[#207D86] hover:text-[#18646b] hover:underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredModules.map((item) => {
                                const gradeNumber = parseGradeNumber(item.grade?.name);
                                const showStream = gradeNumber !== null && gradeNumber >= 12 && item.subjectStream;
                                return (
                            <article 
                                key={item._id} 
                                className="group flex flex-col bg-white rounded-xl border border-slate-200 hover:border-[#207D86]/30 hover:shadow-lg hover:shadow-[#207D86]/5 transition-all duration-300 overflow-hidden"
                            >
                                    {/* Card Header & Thumbnail */}
                                    <div className="relative h-36 bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center">
                                        {item.thumbnailUrl ? (
                                            <img
                                                src={item.thumbnailUrl}
                                                alt={`${item.name} thumbnail`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                                <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                                            </div>
                                        )}
                                        
                                        {/* Stream Badge overlay (show only for A/L) */}
                                        {showStream && (
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-indigo-700 shadow-sm border border-indigo-100">
                                                {item.subjectStream}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h4 className="text-lg font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-[#207D86] transition-colors" title={item.name}>
                                            {item.name}
                                        </h4>
                                        
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                                                <Layers className="w-3 h-3 text-slate-400" />
                                                <span className="truncate max-w-[80px] sm:max-w-[100px]" title={item.level?.name}>{item.level?.name || "N/A"}</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                                                <GraduationCap className="w-3 h-3 text-slate-400" />
                                                <span className="truncate max-w-[80px]" title={item.grade?.name}>{item.grade?.name || "N/A"}</span>
                                            </div>

                                            {showStream && (
                                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-xs font-medium text-indigo-700 border border-indigo-100">
                                                    <span className="truncate max-w-[120px]" title={item.subjectStream}>{item.subjectStream}</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-500 line-clamp-2 mt-auto mb-4 min-h-[40px]">
                                            {item.description || <span className="italic opacity-70">No description provided.</span>}
                                        </p>

                                        {/* Card Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/admin/modules/edit/${item._id}`)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item._id)}
                                                className="inline-flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                                                title="Delete Module"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ModulesManage;