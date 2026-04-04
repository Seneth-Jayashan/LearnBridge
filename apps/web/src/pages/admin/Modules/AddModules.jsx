import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Layers, 
    GraduationCap, 
    BookOpen, 
    Image as ImageIcon, 
    AlignLeft, 
    AlertCircle, 
    Loader2, 
    CheckCircle2, 
    X, 
    Sparkles,
    Library
} from "lucide-react";
import moduleService from "../../../services/ModuleService";
import levelService from "../../../services/LevelService";
import gradeService from "../../../services/GradeService";
import {
    SUBJECT_STREAMS,
    parseGradeNumber,
    getRecommendationTitle,
    getRecommendations,
    filterGradesBySelectedLevel,
    orderLevelsForModules,
} from "./moduleFormConfig";

const initialForm = {
    level: "",
    grade: "",
    subjectStream: "",
    name: "",
    thumbnailUrl: "",
    description: "",
};

const toPublicMediaUrl = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    const origin = apiBase.replace(/\/api\/v1\/?$/i, "");
    return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
};

const AddModules = () => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState([]);
    const [grades, setGrades] = useState([]);
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [selectedSuggestion, setSelectedSuggestion] = useState("");
    const [thumbnailFile, setThumbnailFile] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setError("");
                const [levelData, gradeData] = await Promise.all([
                    levelService.getAllLevels(),
                    gradeService.getAllGrades(),
                ]);
                setLevels(Array.isArray(levelData) ? levelData : []);
                setGrades(Array.isArray(gradeData) ? gradeData : []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load levels and grades.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (selectedSuggestion && formData.name !== selectedSuggestion) {
            setSelectedSuggestion("");
        }
    }, [formData.name, selectedSuggestion]);

    const handleSuggestionClick = (subject) => {
        setFormData((prev) => ({ ...prev, name: subject }));
        setSelectedSuggestion(subject);
        if (error) setError(""); // Clear error when interacting
        const el = document.getElementById("name");
        if (el) el.focus();
    };

    const selectedGrade = useMemo(
        () => grades.find((g) => g._id === formData.grade),
        [grades, formData.grade],
    );
    const orderedLevels = useMemo(() => orderLevelsForModules(levels), [levels]);
    const filteredGrades = useMemo(
        () => filterGradesBySelectedLevel(levels, grades, formData.level),
        [levels, grades, formData.level],
    );
    const gradeNumber = parseGradeNumber(selectedGrade?.name);
    const isAdvanced = gradeNumber !== null && gradeNumber >= 12;

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        if (error) setError(""); // Clear error to improve UX

        if (name === "grade") {
            const selected = filteredGrades.find((g) => g._id === value);
            const selectedNumber = parseGradeNumber(selected?.name);
            setFormData((prev) => ({
                ...prev,
                grade: value,
                subjectStream:
                    selectedNumber !== null && selectedNumber >= 12
                        ? prev.subjectStream
                        : "",
            }));
            return;
        }

        if (name === "level") {
            setFormData((prev) => ({
                ...prev,
                level: value,
                grade: "",
                subjectStream: "",
            }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (event) => {
        const { files } = event.target;
        if (error) setError("");
        if (!files || files.length === 0) return;

        const file = files[0];
        setThumbnailFile(file);
        setFormData((prev) => ({ ...prev, thumbnailUrl: URL.createObjectURL(file) }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.level) return setError("Level is required.");
        if (!formData.grade) return setError("Grade is required.");
        if (isAdvanced && !formData.subjectStream)
            return setError("Subject stream is required for grades 12 and 13.");
        if (!formData.name.trim()) return setError("Module name is required.");

        setIsSubmitting(true);
        setError("");

        const payload = new FormData();
        payload.append("level", formData.level);
        payload.append("grade", formData.grade);
        payload.append("subjectStream", isAdvanced ? formData.subjectStream : "");
        payload.append("name", formData.name.trim());
        payload.append("description", formData.description.trim());

        if (thumbnailFile) {
            payload.append("thumbnail", thumbnailFile);
        }

        try {
            await moduleService.createModule(payload);
            navigate("/admin/modules/manage");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create module. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const recommendations = getRecommendations(
        gradeNumber,
        formData.subjectStream,
    );

    return (
        <section className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
                    Add New Module
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Create a new educational module by selecting level, grade, and stream rules.
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

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-slate-50 rounded-full">
                            <Loader2 className="w-8 h-8 text-[#207D86] animate-spin" />
                        </div>
                        <p className="text-slate-500 font-medium animate-pulse">Loading structure data...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        <div className="space-y-6">
                            
                            {/* Level and Grade Grid */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                {/* Level Select */}
                                <div className="space-y-2">
                                    <label htmlFor="level" className="text-sm font-bold text-slate-700">
                                        Level <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <select
                                            id="level"
                                            name="level"
                                            value={formData.level}
                                            onChange={handleInputChange}
                                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 appearance-none"
                                        >
                                            <option value="">Select level...</option>
                                            {orderedLevels.map((item) => (
                                                <option key={item._id} value={item._id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Grade Select */}
                                <div className="space-y-2">
                                    <label htmlFor="grade" className="text-sm font-bold text-slate-700">
                                        Grade <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <select
                                            id="grade"
                                            name="grade"
                                            value={formData.grade}
                                            onChange={handleInputChange}
                                            disabled={!formData.level}
                                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select grade...</option>
                                            {filteredGrades.map((item) => (
                                                <option key={item._id} value={item._id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Subject Stream (Conditional) */}
                            {isAdvanced && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label htmlFor="subjectStream" className="text-sm font-bold text-slate-700">
                                        Subject Stream <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <select
                                            id="subjectStream"
                                            name="subjectStream"
                                            value={formData.subjectStream}
                                            onChange={handleInputChange}
                                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 appearance-none"
                                        >
                                            <option value="">Select subject stream...</option>
                                            {SUBJECT_STREAMS.map((stream) => (
                                                <option key={stream} value={stream}>
                                                    {stream}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations / Suggestions Block */}
                            {formData.level && formData.grade && recommendations.length > 0 && (
                                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <p className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mb-3">
                                        <Sparkles className="w-4 h-4 text-indigo-600" />
                                        {getRecommendationTitle(gradeNumber)}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {recommendations.map((subject) => (
                                            <button
                                                type="button"
                                                key={subject}
                                                onClick={() => handleSuggestionClick(subject)}
                                                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-95 ${
                                                    selectedSuggestion === subject
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                                        : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300"
                                                }`}
                                            >
                                                {subject}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Module Name Input */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-bold text-slate-700">
                                    Module Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <Library className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200"
                                        placeholder="e.g., Algebra Basics"
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
                                    <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                        <AlignLeft className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all duration-200 resize-none"
                                        placeholder="A short summary of what this module covers..."
                                    />
                                </div>
                            </div>

                            {/* Thumbnail File Input */}
                            <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                                <label htmlFor="thumbnailUrl" className="text-sm font-bold text-slate-700 block mb-3">
                                    Thumbnail Image <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="relative group flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="thumbnailUrl"
                                            name="thumbnailUrl"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition-all file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#207D86]/10 file:text-[#207D86] hover:file:bg-[#207D86]/20 cursor-pointer"
                                        />
                                    </div>
                                    
                                    {/* Thumbnail Preview */}
                                    {formData.thumbnailUrl && (
                                        <div className="shrink-0 p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            <img
                                                src={toPublicMediaUrl(formData.thumbnailUrl)}
                                                alt="Module preview"
                                                className="h-16 w-16 object-cover rounded-md border border-slate-100"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex flex-col-reverse sm:flex-row items-center gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/modules/manage")}
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
                                        Create Module
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
};

export default AddModules;