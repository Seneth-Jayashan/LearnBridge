import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const AddModules = () => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState([]);
    const [grades, setGrades] = useState([]);
    const [formData, setFormData] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [selectedSuggestion, setSelectedSuggestion] = useState("");

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
                setError(
                    err.response?.data?.message || "Failed to load levels and grades",
                );
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

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.level) return setError("Level is required");
        if (!formData.grade) return setError("Grade is required");
        if (isAdvanced && !formData.subjectStream)
            return setError("Subject stream is required for grades 12 and 13");
        if (!formData.name.trim()) return setError("Module name is required");

        setIsSubmitting(true);
        setError("");

        const payload = {
            level: formData.level,
            grade: formData.grade,
            subjectStream: isAdvanced ? formData.subjectStream : null,
            name: formData.name.trim(),
            thumbnailUrl: formData.thumbnailUrl.trim(),
            description: formData.description.trim(),
        };

        try {
            await moduleService.createModule(payload);
            navigate("/admin/modules/manage");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create module");
        } finally {
            setIsSubmitting(false);
        }
    };

    const recommendations = getRecommendations(
        gradeNumber,
        formData.subjectStream,
    );

    return (
        <section className="max-w-6xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#0E2A47]">Add Module</h2>
                <p className="text-slate-600 mt-1">
                    Create module by level, grade, and stream rules.
                </p>
            </div>

                {/* Content URL removed */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

            {isLoading ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-600">
                    Loading levels and grades...
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                >
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="level"
                                className="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Level
                            </label>
                            <select
                                id="level"
                                name="level"
                                value={formData.level}
                                onChange={handleInputChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                            >
                                <option value="">Select level</option>
                                {orderedLevels.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="grade"
                                className="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Grade
                            </label>
                            <select
                                id="grade"
                                name="grade"
                                value={formData.grade}
                                onChange={handleInputChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                            >
                                <option value="">Select grade</option>
                                {filteredGrades.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isAdvanced && (
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="subjectStream"
                                    className="block text-sm font-semibold text-slate-700 mb-1"
                                >
                                    Subject Stream
                                </label>
                                <select
                                    id="subjectStream"
                                    name="subjectStream"
                                    value={formData.subjectStream}
                                    onChange={handleInputChange}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                                >
                                    <option value="">Select subject stream</option>
                                    {SUBJECT_STREAMS.map((stream) => (
                                        <option key={stream} value={stream}>
                                            {stream}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Module Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                                placeholder="Algebra Basics"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="thumbnailUrl"
                                className="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Thumbnail Image URL
                            </label>
                            <input
                                id="thumbnailUrl"
                                name="thumbnailUrl"
                                value={formData.thumbnailUrl}
                                onChange={handleInputChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                                placeholder="https://example.com/module-thumbnail.jpg"
                            />
                        </div>

                        {/* Content URL removed */}

                        <div className="md:col-span-2">
                            <label
                                htmlFor="description"
                                className="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                                placeholder="Short module summary"
                            />
                        </div>

                        {formData.level && formData.grade && recommendations.length > 0 && (
                            <div className="md:col-span-2 border border-slate-200 rounded-lg p-4 bg-slate-50">
                                <p className="text-sm font-semibold text-slate-800 mb-2">
                                    {getRecommendationTitle(gradeNumber)}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {recommendations.map((subject) => (
                                        <span
                                            key={subject}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleSuggestionClick(subject)}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" && handleSuggestionClick(subject)
                                            }
                                            className="cursor-pointer px-2.5 py-1 rounded-full bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
                                        >
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B] disabled:opacity-60"
                        >
                            {isSubmitting ? "Saving..." : "Create Module"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/modules/manage")}
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

export default AddModules;
