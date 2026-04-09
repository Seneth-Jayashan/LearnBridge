import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Library, GitBranch } from "lucide-react";
import quizService from "../../../services/QuizService.jsx";
import triviaService from "../../../services/TriviaService.jsx";
import pdfService from "../../../services/PdfService.jsx";
import moduleService from "../../../services/ModuleService";

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

// ── Helpers (mirrored from LessonsAdd) ───────────────────────────────
const getGradeNumber = (gradeName) => {
  const match = String(gradeName || "").match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isNaN(parsed) ? null : parsed;
};

const isAdvancedModule = (moduleItem) => {
  const levelName = String(moduleItem?.level?.name || moduleItem?.level || "").toLowerCase();
  if (levelName.includes("advanced")) return true;
  const gradeName = moduleItem?.grade?.name || moduleItem?.grade;
  const gradeNumber = getGradeNumber(gradeName);
  return gradeNumber !== null && gradeNumber >= 12;
};

// ── Toast ─────────────────────────────────────────────────────────────
const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-300
      ${type === "success"
        ? "bg-white border border-emerald-200 text-emerald-700"
        : "bg-white border border-red-200 text-red-700"}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
      {message}
    </div>
  );
};

// ── PDF Question Preview ──────────────────────────────────────────────
const PDFQuestionPreview = ({ questions, onConfirm, onBack }) => {
  const [selected, setSelected] = useState(() => new Set(questions.map((_, i) => i)));

  const toggleAll = () => {
    if (selected.size === questions.length) setSelected(new Set());
    else setSelected(new Set(questions.map((_, i) => i)));
  };

  return (
    <div className="flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Review Generated Questions</h2>
          <p className="text-xs text-slate-500 mt-0.5">{selected.size} of {questions.length} selected</p>
        </div>
        <button
          onClick={toggleAll}
          className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
        >
          {selected.size === questions.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: "380px" }}>
        {questions.map((q, i) => {
          const isSelected = selected.has(i);
          return (
            <div
              key={i}
              onClick={() => {
                const next = new Set(selected);
                isSelected ? next.delete(i) : next.add(i);
                setSelected(next);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition
                ${isSelected
                  ? "bg-[#207D86]/10 border-[#207D86]/30"
                  : "bg-slate-50 border-slate-200 opacity-60"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition
                  ${isSelected ? "bg-[#207D86] border-[#207D86]" : "border-slate-300"}`}
                >
                  {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 mb-2">{q.questionText}</p>
                  <div className="space-y-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2
                          ${oIdx === q.correctAnswer
                            ? "bg-[#207D86]/10 text-[#207D86] border border-[#207D86]/20"
                            : "text-slate-500"}`}
                      >
                        <span className="font-bold w-4">{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                        {oIdx === q.correctAnswer && <span className="ml-auto text-[10px]">✓ correct</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
        >
          ← Back
        </button>
        <button
          onClick={() => onConfirm(questions.filter((_, i) => selected.has(i)))}
          disabled={selected.size === 0}
          className="flex-1 py-2.5 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition text-sm font-semibold disabled:opacity-40"
        >
          Add {selected.size} Question{selected.size !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
};

// ── Import Modal ──────────────────────────────────────────────────────
const ImportModal = ({ onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState("pdf");

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfConfig, setPdfConfig] = useState({ amount: 10, difficulty: "medium" });
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [triviaImporting, setTriviaImporting] = useState(false);
  const [triviaConfig, setTriviaConfig] = useState({ amount: 10, category: "", difficulty: "" });
  const [triviaMode, setTriviaMode] = useState("import");
  const [triviaError, setTriviaError] = useState("");

  useEffect(() => {
    if (activeTab === "trivia" && categories.length === 0) {
      setLoadingCats(true);
      triviaService.fetchCategories()
        .then(setCategories)
        .catch(() => setTriviaError("Failed to load categories."))
        .finally(() => setLoadingCats(false));
    }
  }, [activeTab]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfError("");
      setGeneratedQuestions(null);
    } else {
      setPdfError("Please upload a valid PDF file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfError("");
      setGeneratedQuestions(null);
    } else {
      setPdfError("Please drop a valid PDF file.");
    }
  };

  const generateFromPDF = async () => {
    if (!pdfFile) { setPdfError("Please upload a PDF first."); return; }
    setPdfError("");
    setGenerating(true);
    try {
      const { questions } = await pdfService.generateQuestionsFromPDF(pdfFile, pdfConfig.amount, pdfConfig.difficulty);
      if (!questions || questions.length === 0) throw new Error("No questions were generated. Try a different PDF.");
      setGeneratedQuestions(questions);
    } catch (err) {
      setPdfError(err?.response?.data?.message || err?.message || "Failed to generate questions.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePDFConfirm = (selectedQuestions) => {
    onImport({ questions: selectedQuestions, mode: "import", source: "pdf" });
    onClose();
  };

  const handleTriviaImport = async () => {
    setTriviaError("");
    setTriviaImporting(true);
    try {
      const questions = await triviaService.fetchQuestions(triviaConfig);
      const categoryName = categories.find((c) => c.id === Number(triviaConfig.category))?.name || "";
      onImport({ questions, mode: triviaMode, category: categoryName, source: "trivia" });
      onClose();
    } catch (err) {
      setTriviaError(err.message || "Import failed.");
    } finally {
      setTriviaImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-lg" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-sm font-bold text-slate-800">Import Questions</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition text-lg leading-none">✕</button>
        </div>

        {!generatedQuestions && (
          <div className="flex border-b border-slate-100 shrink-0">
            {["pdf", "trivia"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2
                  ${activeTab === tab ? "text-[#207D86] border-b-2 border-[#207D86]" : "text-slate-500 hover:text-slate-700"}`}
              >
                {tab === "pdf" ? "📄 From PDF" : "🌐 Trivia DB"}
              </button>
            ))}
          </div>
        )}

        {generatedQuestions ? (
          <PDFQuestionPreview questions={generatedQuestions} onConfirm={handlePDFConfirm} onBack={() => setGeneratedQuestions(null)} />
        ) : activeTab === "pdf" ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition
                ${pdfFile ? "border-[#207D86]/40 bg-[#207D86]/5" : "border-slate-300 hover:border-[#207D86]/50 hover:bg-[#207D86]/5"}`}
            >
              <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              {pdfFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-[#207D86]/10 border border-[#207D86]/30 rounded-xl flex items-center justify-center text-xl">📄</div>
                  <p className="text-sm font-semibold text-[#207D86] truncate max-w-xs">{pdfFile.name}</p>
                  <p className="text-xs text-slate-500">{(pdfFile.size / 1024).toFixed(0)} KB · Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-xl">📁</div>
                  <p className="text-sm font-semibold text-slate-800">Drop your PDF here</p>
                  <p className="text-xs text-slate-500">or click to browse files</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Questions to generate: <span className="text-[#207D86]">{pdfConfig.amount}</span>
              </label>
              <input type="range" min={1} max={30} value={pdfConfig.amount}
                onChange={(e) => setPdfConfig((p) => ({ ...p, amount: Number(e.target.value) }))}
                className="w-full accent-[#207D86]" />
              <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>30</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {["easy", "medium", "hard"].map((d) => (
                  <button key={d} onClick={() => setPdfConfig((p) => ({ ...p, difficulty: d }))}
                    className={`py-2 rounded-xl text-xs font-semibold border transition capitalize
                      ${pdfConfig.difficulty === d
                        ? d === "easy" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : d === "medium" ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-red-50 border-red-200 text-red-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >{d}</button>
                ))}
              </div>
            </div>

            {pdfError && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />{pdfError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium">Cancel</button>
              <button onClick={generateFromPDF} disabled={generating || !pdfFile}
                className="flex-1 py-2.5 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition text-sm font-semibold shadow-lg shadow-[#207D86]/20 disabled:opacity-40">
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...
                  </span>
                ) : `Generate ${pdfConfig.amount} Questions`}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Import Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "import", icon: "➕", label: "Add to existing quiz", sub: "Appends questions" },
                  { value: "generate", icon: "⚡", label: "Auto-generate quiz", sub: "Replaces everything" },
                ].map(({ value, icon, label, sub }) => (
                  <button key={value} onClick={() => setTriviaMode(value)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-left
                      ${triviaMode === value ? "bg-[#207D86]/10 border-[#207D86]/40 text-[#207D86]" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                    <div className="text-base mb-0.5">{icon}</div>
                    {label}
                    <div className="text-slate-500 font-normal mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Number of Questions: <span className="text-[#207D86]">{triviaConfig.amount}</span>
              </label>
              <input type="range" min={1} max={50} value={triviaConfig.amount}
                onChange={(e) => setTriviaConfig((p) => ({ ...p, amount: Number(e.target.value) }))}
                className="w-full accent-[#207D86]" />
              <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>50</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
              {loadingCats ? (
                <div className="text-xs text-slate-500 animate-pulse">Loading categories...</div>
              ) : (
                <select value={triviaConfig.category}
                  onChange={(e) => setTriviaConfig((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition">
                  <option value="">Any Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty</label>
              <div className="grid grid-cols-4 gap-2">
                {["", "easy", "medium", "hard"].map((d) => (
                  <button key={d} onClick={() => setTriviaConfig((p) => ({ ...p, difficulty: d }))}
                    className={`py-2 rounded-xl text-xs font-semibold border transition capitalize
                      ${triviaConfig.difficulty === d
                        ? d === "" ? "bg-[#207D86]/10 border-[#207D86]/40 text-[#207D86]"
                          : d === "easy" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : d === "medium" ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-red-50 border-red-200 text-red-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                    {d === "" ? "Any" : d}
                  </button>
                ))}
              </div>
            </div>

            {triviaError && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />{triviaError}
              </div>
            )}

            <p className="text-xs text-slate-500">
              {triviaMode === "import"
                ? "✅ Questions will be appended to your current quiz."
                : "⚠️ Auto-generate will replace your current questions and pre-fill the title."}
            </p>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium">Cancel</button>
              <button onClick={handleTriviaImport} disabled={triviaImporting || loadingCats}
                className="flex-1 py-2.5 bg-[#207D86] text-white rounded-xl hover:bg-[#18646b] transition text-sm font-semibold shadow-lg shadow-[#207D86]/20 disabled:opacity-40">
                {triviaImporting ? "Fetching..." : triviaMode === "import" ? `Import ${triviaConfig.amount} Questions` : "Generate Quiz"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [showImportModal, setShowImportModal] = useState(false);

  // ── Module fetch state ────────────────────────────────────────────
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [moduleError, setModuleError] = useState("");

  const selectedModule = useMemo(
    () => modules.find((m) => String(m._id) === String(moduleId)) || null,
    [modules, moduleId]
  );

  useEffect(() => {
    moduleService.getAllModules()
      .then((data) => setModules(Array.isArray(data) ? data : []))
      .catch(() => setModuleError("Failed to load modules."))
      .finally(() => setLoadingModules(false));
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const resetForm = () => {
    setTitle("");
    setModuleId("");
    setTimeLimit(10);
    setQuestions([emptyQuestion()]);
    setError("");
  };

  const handleImport = ({ questions: imported, mode, category = "", source }) => {
    if (mode === "import") {
      setQuestions((prev) => {
        const isStarterBlank = prev.length === 1 && !prev[0].questionText && prev[0].options.every((o) => !o);
        return isStarterBlank ? imported : [...prev, ...imported];
      });
      showToast(
        source === "pdf"
          ? `${imported.length} questions generated from PDF!`
          : `${imported.length} questions imported from Trivia DB!`,
        "success"
      );
    } else {
      setQuestions(imported);
      if (category) setTitle(`${category} Quiz`);
      setTimeLimit(Math.min(Math.max(Math.round(imported.length * 1.5), 1), 120));
      showToast(`Quiz auto-generated with ${imported.length} questions!`, "success");
    }
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (qIndex) => setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  const updateQuestionText = (qIndex, value) =>
    setQuestions((prev) => { const u = [...prev]; u[qIndex] = { ...u[qIndex], questionText: value }; return u; });
  const updateOption = (qIndex, oIndex, value) =>
    setQuestions((prev) => { const u = [...prev]; const opts = [...u[qIndex].options]; opts[oIndex] = value; u[qIndex] = { ...u[qIndex], options: opts }; return u; });
  const setCorrectAnswer = (qIndex, oIndex) =>
    setQuestions((prev) => { const u = [...prev]; u[qIndex] = { ...u[qIndex], correctAnswer: oIndex }; return u; });

  const handleSubmit = async (isPublished = false) => {
    setError("");
    if (!title.trim()) return setError("Quiz title is required.");
    if (!moduleId) return setError("Please select a module.");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return setError(`Question ${i + 1} text is empty.`);
      if (q.options.some((o) => !o.trim())) return setError(`All options in Question ${i + 1} must be filled.`);
    }

    try {
      setLoading(true);
      await quizService.createQuiz({ title, moduleId, timeLimit: Number(timeLimit), questions, isPublished });
      showToast(isPublished ? "Quiz created & published successfully!" : "Quiz saved as draft successfully!", "success");
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create quiz.");
      showToast("Failed to create quiz.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast message={toast.message} type={toast.type} />

      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} onImport={handleImport} />
      )}

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-5">
        {/* Header Section */}
        <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
              Create New Quiz
            </h2>
            <p className="text-slate-500 mt-2 text-sm md:text-base">
              Build quiz questions manually or import them from PDF and Trivia DB.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all active:scale-[0.98]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />{error}
          </div>
        )}

        {/* ── Quiz Settings ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-[#207D86] uppercase tracking-widest">Quiz Settings</h2>
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#207D86]/10 border border-[#207D86]/20 text-[#207D86] rounded-lg hover:bg-[#207D86]/20 transition text-xs font-semibold">
              ✨ Import Questions
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Quiz Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Algebra Basics"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition" />
          </div>

          {/* ── Module Dropdown (replaces Module ID text input) ── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Module</label>

            {moduleError && (
              <p className="text-xs text-red-400 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />{moduleError}
              </p>
            )}

            <div className="relative group">
              {/* Icon */}
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                <Library className="w-4 h-4" />
              </div>

              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                disabled={loadingModules}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800
                  focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition
                  appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingModules ? "Loading modules..." : "Select a module..."}
                </option>
                {modules.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                    {item?.grade?.name
                      ? ` — ${/grade/i.test(item.grade.name) ? item.grade.name : (/\d/.test(item.grade.name) ? `Grade ${item.grade.name}` : item.grade.name)}`
                      : item?.grade
                        ? ` — ${/grade/i.test(String(item.grade)) ? item.grade : (/\d/.test(String(item.grade)) ? `Grade ${item.grade}` : item.grade)}`
                        : ""}
                    {isAdvancedModule(item) && item?.subjectStream ? ` — ${item.subjectStream}` : ""}
                  </option>
                ))}
              </select>

              {/* Custom chevron */}
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Selected module info badges — mirrors LessonsAdd */}
            {selectedModule && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 px-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                  <span className="text-slate-400">Level:</span>
                  {selectedModule?.level?.name || selectedModule?.level || "N/A"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                  <span className="text-slate-400">Grade:</span>
                  {selectedModule?.grade?.name || selectedModule?.grade || "N/A"}
                </span>
                {isAdvancedModule(selectedModule) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                    <GitBranch className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400">Stream:</span>
                    {selectedModule?.subjectStream || "N/A"}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Time Limit: <span className="text-[#207D86] font-semibold">{timeLimit} minutes</span>
            </label>
            <input type="range" min={1} max={120} step={1} value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)} className="w-full accent-[#207D86]" />
            <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1 min</span><span>120 min</span></div>
          </div>
        </div>

        {/* ── Questions Count Banner ────────────────────────────── */}
        {questions.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#207D86]/10 border border-[#207D86]/20 rounded-xl">
            <span className="text-xs text-[#207D86] font-semibold">📋 {questions.length} questions in this quiz</span>
            <button onClick={() => setQuestions([emptyQuestion()])} className="text-xs text-red-500/70 hover:text-red-600 transition">Clear all</button>
          </div>
        )}

        {/* ── Questions ─────────────────────────────────────────── */}
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#207D86] flex items-center justify-center text-xs font-bold text-white">
                  {qIndex + 1}
                </div>
                <span className="text-xs font-bold text-[#207D86] uppercase tracking-widest">Question {qIndex + 1}</span>
              </div>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(qIndex)} className="text-xs text-red-500/70 hover:text-red-600 transition">✕ Remove</button>
              )}
            </div>

            <input value={q.questionText} onChange={(e) => updateQuestionText(qIndex, e.target.value)}
              placeholder="Enter your question here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition" />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options - click ✓ to mark correct answer</p>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <button onClick={() => setCorrectAnswer(qIndex, oIndex)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition font-bold text-sm
                      ${q.correctAnswer === oIndex
                        ? "bg-[#207D86] border-[#207D86] text-white shadow-lg shadow-[#207D86]/20"
                        : "border-slate-300 text-slate-400 hover:border-[#207D86]/50 hover:text-[#207D86]/70"}`}>
                    ✓
                  </button>
                  <input value={opt} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    className={`flex-1 bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:border-[#207D86] transition
                      ${q.correctAnswer === oIndex
                        ? "border-[#207D86]/40 focus:ring-[#207D86]/10 bg-[#207D86]/5"
                        : "border-slate-200 focus:ring-[#207D86]/10"}`} />
                  <span className="text-xs text-slate-500 w-4 font-mono">{String.fromCharCode(65 + oIndex)}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Correct answer: <span className="text-[#207D86] font-semibold">Option {String.fromCharCode(65 + q.correctAnswer)}</span>
            </p>
          </div>
        ))}

        {/* ── Bottom Action Bar ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={addQuestion}
            className="py-4 border-2 border-dashed border-[#207D86]/30 rounded-2xl text-[#207D86] hover:border-[#207D86]/60 hover:bg-[#207D86]/5 transition font-medium text-sm">
            + Add Question Manually
          </button>
          <button onClick={() => setShowImportModal(true)}
            className="py-4 border-2 border-dashed border-[#207D86]/30 rounded-2xl text-[#207D86] hover:border-[#207D86]/60 hover:bg-[#207D86]/5 transition font-medium text-sm flex items-center justify-center gap-2">
            ✨ Import Questions
          </button>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}