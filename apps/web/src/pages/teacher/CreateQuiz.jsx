import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import quizService from "../../services/QuizService.jsx";
import triviaService from "../../services/TriviaService.jsx";
import pdfService from "../../services/PdfService.jsx";

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

// ── Toast ─────────────────────────────────────────────────────────────
const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-300
      ${type === "success"
        ? "bg-[#0A1D32] border border-[#4CAF50]/40 text-white"
        : "bg-[#0A1D32] border border-red-400/40 text-white"}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${type === "success" ? "bg-[#4CAF50]" : "bg-red-400"}`} />
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
      {/* Preview Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-white">Review Generated Questions</h2>
          <p className="text-xs text-slate-500 mt-0.5">{selected.size} of {questions.length} selected</p>
        </div>
        <button
          onClick={toggleAll}
          className="text-xs px-3 py-1.5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/5 transition"
        >
          {selected.size === questions.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Questions List */}
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
                  ? "bg-[#207D86]/10 border-[#207D86]/40"
                  : "bg-white/3 border-white/5 opacity-50"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition
                  ${isSelected ? "bg-[#4CAF50] border-[#4CAF50]" : "border-white/20"}`}
                >
                  {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white mb-2">{q.questionText}</p>
                  <div className="space-y-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2
                          ${oIdx === q.correctAnswer
                            ? "bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/20"
                            : "text-slate-400"}`}
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

      {/* Preview Actions */}
      <div className="px-6 py-4 border-t border-white/5 flex gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 transition text-sm font-medium"
        >
          ← Back
        </button>
        <button
          onClick={() => onConfirm(questions.filter((_, i) => selected.has(i)))}
          disabled={selected.size === 0}
          className="flex-1 py-2.5 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-xl hover:opacity-90 transition text-sm font-semibold disabled:opacity-40"
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

  // ── PDF State ──────────────────────────────────────────────────────
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfConfig, setPdfConfig] = useState({ amount: 10, difficulty: "medium" });
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const fileInputRef = useRef(null);

  // ── Trivia State ───────────────────────────────────────────────────
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

  // ── PDF Handlers ───────────────────────────────────────────────────
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

  // ── Uses PdfService instead of direct Anthropic fetch ─────────────
  const generateFromPDF = async () => {
    if (!pdfFile) return setPdfError("Please upload a PDF first.");
    setPdfError("");
    setGenerating(true);

    try {
      // Convert PDF file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(pdfFile);
      });

      // Call backend via PdfService
      const { questions } = await pdfService.generateQuestionsFromPDF(
        base64,
        pdfConfig.amount,
        pdfConfig.difficulty
      );

      if (!questions || questions.length === 0)
        throw new Error("No questions were generated. Try a different PDF.");

      setGeneratedQuestions(questions);
    } catch (err) {
      setPdfError(err.response?.data?.message || err.message || "Failed to generate questions.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePDFConfirm = (selectedQuestions) => {
    onImport({ questions: selectedQuestions, mode: "import", source: "pdf" });
    onClose();
  };

  // ── Trivia Handler ─────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0A1D32] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="text-sm font-bold text-white">Import Questions</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-lg leading-none">✕</button>
        </div>

        {/* Tabs — hidden during preview */}
        {!generatedQuestions && (
          <div className="flex border-b border-white/5 flex-shrink-0">
            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2
                ${activeTab === "pdf"
                  ? "text-[#4CAF50] border-b-2 border-[#4CAF50]"
                  : "text-slate-500 hover:text-slate-300"}`}
            >
              📄 From PDF
            </button>
            <button
              onClick={() => setActiveTab("trivia")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2
                ${activeTab === "trivia"
                  ? "text-[#4CAF50] border-b-2 border-[#4CAF50]"
                  : "text-slate-500 hover:text-slate-300"}`}
            >
              🌐 Trivia DB
            </button>
          </div>
        )}

        {/* ── PDF Preview ────────────────────────────────────────── */}
        {generatedQuestions ? (
          <PDFQuestionPreview
            questions={generatedQuestions}
            onConfirm={handlePDFConfirm}
            onBack={() => setGeneratedQuestions(null)}
          />
        ) : activeTab === "pdf" ? (
          // ── PDF Tab ────────────────────────────────────────────
          <div className="p-6 space-y-5 overflow-y-auto">

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition
                ${pdfFile
                  ? "border-[#4CAF50]/40 bg-[#4CAF50]/5"
                  : "border-white/10 hover:border-[#207D86]/50 hover:bg-[#207D86]/5"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {pdfFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-[#4CAF50]/15 border border-[#4CAF50]/30 rounded-xl flex items-center justify-center text-xl">
                    📄
                  </div>
                  <p className="text-sm font-semibold text-[#4CAF50] truncate max-w-xs">{pdfFile.name}</p>
                  <p className="text-xs text-slate-500">{(pdfFile.size / 1024).toFixed(0)} KB · Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-xl">
                    📁
                  </div>
                  <p className="text-sm font-semibold text-white">Drop your PDF here</p>
                  <p className="text-xs text-slate-500">or click to browse files</p>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Questions to generate: <span className="text-[#4CAF50]">{pdfConfig.amount}</span>
              </label>
              <input
                type="range" min={1} max={30}
                value={pdfConfig.amount}
                onChange={(e) => setPdfConfig((p) => ({ ...p, amount: Number(e.target.value) }))}
                className="w-full accent-[#4CAF50]"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>1</span><span>30</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setPdfConfig((p) => ({ ...p, difficulty: d }))}
                    className={`py-2 rounded-xl text-xs font-semibold border transition capitalize
                      ${pdfConfig.difficulty === d
                        ? d === "easy"   ? "bg-green-400/15 border-green-400/30 text-green-400"
                          : d === "medium" ? "bg-yellow-400/15 border-yellow-400/30 text-yellow-400"
                          :                  "bg-red-400/15 border-red-400/30 text-red-400"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {pdfError && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                {pdfError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={generateFromPDF}
                disabled={generating || !pdfFile}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-lg shadow-[#207D86]/30 disabled:opacity-40"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : `Generate ${pdfConfig.amount} Questions`}
              </button>
            </div>
          </div>

        ) : (
          // ── Trivia Tab ─────────────────────────────────────────
          <div className="p-6 space-y-5 overflow-y-auto">

            {/* Mode Toggle */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Import Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTriviaMode("import")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-left
                    ${triviaMode === "import"
                      ? "bg-[#207D86]/20 border-[#207D86]/50 text-[#4CAF50]"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"}`}
                >
                  <div className="text-base mb-0.5">➕</div>
                  Add to existing quiz
                  <div className="text-slate-500 font-normal mt-0.5">Appends questions</div>
                </button>
                <button
                  onClick={() => setTriviaMode("generate")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-left
                    ${triviaMode === "generate"
                      ? "bg-[#207D86]/20 border-[#207D86]/50 text-[#4CAF50]"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"}`}
                >
                  <div className="text-base mb-0.5">⚡</div>
                  Auto-generate quiz
                  <div className="text-slate-500 font-normal mt-0.5">Replaces everything</div>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Number of Questions: <span className="text-[#4CAF50]">{triviaConfig.amount}</span>
              </label>
              <input
                type="range" min={1} max={50}
                value={triviaConfig.amount}
                onChange={(e) => setTriviaConfig((p) => ({ ...p, amount: Number(e.target.value) }))}
                className="w-full accent-[#4CAF50]"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>1</span><span>50</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
              {loadingCats ? (
                <div className="text-xs text-slate-500 animate-pulse">Loading categories...</div>
              ) : (
                <select
                  value={triviaConfig.category}
                  onChange={(e) => setTriviaConfig((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#207D86] transition"
                >
                  <option value="">Any Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#0A1D32]">{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty</label>
              <div className="grid grid-cols-4 gap-2">
                {["", "easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setTriviaConfig((p) => ({ ...p, difficulty: d }))}
                    className={`py-2 rounded-xl text-xs font-semibold border transition capitalize
                      ${triviaConfig.difficulty === d
                        ? d === ""       ? "bg-[#207D86]/20 border-[#207D86]/50 text-[#4CAF50]"
                          : d === "easy"   ? "bg-green-400/15 border-green-400/30 text-green-400"
                          : d === "medium" ? "bg-yellow-400/15 border-yellow-400/30 text-yellow-400"
                          :                  "bg-red-400/15 border-red-400/30 text-red-400"
                        : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"}`}
                  >
                    {d === "" ? "Any" : d}
                  </button>
                ))}
              </div>
            </div>

            {triviaError && (
              <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                {triviaError}
              </div>
            )}

            <p className="text-xs text-slate-500">
              {triviaMode === "import"
                ? "✅ Questions will be appended to your current quiz."
                : "⚠️ Auto-generate will replace your current questions and pre-fill the title."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-white/10 text-slate-400 rounded-xl hover:bg-white/5 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTriviaImport}
                disabled={triviaImporting || loadingCats}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-lg shadow-[#207D86]/30 disabled:opacity-40"
              >
                {triviaImporting
                  ? "Fetching..."
                  : triviaMode === "import" ? `Import ${triviaConfig.amount} Questions` : "Generate Quiz"}
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

  // ── Unified Import Handler ─────────────────────────────────────────
  const handleImport = ({ questions: imported, mode, category = "", source }) => {
    if (mode === "import") {
      setQuestions((prev) => {
        const isStarterBlank =
          prev.length === 1 && !prev[0].questionText && prev[0].options.every((o) => !o);
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
      setTimeLimit(Math.min(Math.max(Math.round(imported.length * 1.5), 5), 120));
      showToast(`Quiz auto-generated with ${imported.length} questions!`, "success");
    }
  };

  // ── Question helpers ──────────────────────────────────────────────
  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (qIndex) =>
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));

  const updateQuestionText = (qIndex, value) =>
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], questionText: value };
      return updated;
    });

  const updateOption = (qIndex, oIndex, value) =>
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[oIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });

  const setCorrectAnswer = (qIndex, oIndex) =>
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], correctAnswer: oIndex };
      return updated;
    });

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (isPublished = false) => {
    setError("");
    if (!title.trim()) return setError("Quiz title is required.");
    if (!moduleId.trim()) return setError("Module ID is required.");
    if (!/^[a-fA-F0-9]{24}$/.test(moduleId.trim()))
      return setError("Module ID is not valid. Please paste a correct MongoDB ObjectId.");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return setError(`Question ${i + 1} text is empty.`);
      if (q.options.some((o) => !o.trim()))
        return setError(`All options in Question ${i + 1} must be filled.`);
    }

    try {
      setLoading(true);
      await quizService.createQuiz({
        title,
        moduleId: moduleId.trim(),
        timeLimit: Number(timeLimit),
        questions,
        isPublished,
      });
      showToast(
        isPublished ? "Quiz created & published successfully!" : "Quiz saved as draft successfully!",
        "success"
      );
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create quiz.");
      showToast("Failed to create quiz.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1E30]">

      <Toast message={toast.message} type={toast.type} />

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-[#0A1D32] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition text-sm">
            ← Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <h1 className="text-lg font-bold text-white tracking-wide">Create New Quiz</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-4 py-2 border border-[#207D86] text-[#4CAF50] rounded-lg hover:bg-[#207D86]/20 transition font-medium text-sm disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white rounded-lg hover:opacity-90 transition font-medium text-sm disabled:opacity-40 shadow-lg shadow-[#207D86]/30"
          >
            {loading ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-5">

        {error && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Quiz Settings ─────────────────────────────────────── */}
        <div className="bg-[#0A1D32] rounded-2xl border border-white/5 p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest">Quiz Settings</h2>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#207D86]/15 border border-[#207D86]/30 text-[#4CAF50] rounded-lg hover:bg-[#207D86]/25 transition text-xs font-semibold"
            >
              ✨ Import Questions
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Quiz Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Algebra Basics"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#207D86] focus:border-transparent transition"
            />
          </div>

          {/* Module ID */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Module ID
              <span className="ml-2 text-xs text-slate-600 font-normal">(MongoDB ObjectId of the module)</span>
            </label>
            <input
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              placeholder="e.g. 6998a9b741f544ca50307646"
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition
                ${moduleId && !/^[a-fA-F0-9]{24}$/.test(moduleId)
                  ? "border-red-400/40 focus:ring-red-400"
                  : "border-white/10 focus:ring-[#207D86]"}`}
            />
            {moduleId && !/^[a-fA-F0-9]{24}$/.test(moduleId) && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                Must be a 24-character MongoDB ObjectId
              </p>
            )}
            {moduleId && /^[a-fA-F0-9]{24}$/.test(moduleId) && (
              <p className="text-xs text-[#4CAF50] mt-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full" />
                Valid Module ID
              </p>
            )}
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Time Limit: <span className="text-[#4CAF50] font-semibold">{timeLimit} minutes</span>
            </label>
            <input
              type="range" min={5} max={120} step={5}
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full accent-[#4CAF50]"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>5 min</span><span>120 min</span>
            </div>
          </div>
        </div>

        {/* ── Questions Count Banner ────────────────────────────── */}
        {questions.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#207D86]/10 border border-[#207D86]/20 rounded-xl">
            <span className="text-xs text-[#4CAF50] font-semibold">
              📋 {questions.length} questions in this quiz
            </span>
            <button
              onClick={() => setQuestions([emptyQuestion()])}
              className="text-xs text-red-400/50 hover:text-red-400 transition"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Questions ─────────────────────────────────────────── */}
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-[#0A1D32] rounded-2xl border border-white/5 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#207D86] to-[#4CAF50] flex items-center justify-center text-xs font-bold text-white">
                  {qIndex + 1}
                </div>
                <span className="text-xs font-bold text-[#4CAF50] uppercase tracking-widest">
                  Question {qIndex + 1}
                </span>
              </div>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(qIndex)} className="text-xs text-red-400/50 hover:text-red-400 transition">
                  ✕ Remove
                </button>
              )}
            </div>

            <input
              value={q.questionText}
              onChange={(e) => updateQuestionText(qIndex, e.target.value)}
              placeholder="Enter your question here..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#207D86] focus:border-transparent transition"
            />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Options — click ✓ to mark correct answer
              </p>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <button
                    onClick={() => setCorrectAnswer(qIndex, oIndex)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition font-bold text-sm
                      ${q.correctAnswer === oIndex
                        ? "bg-[#4CAF50] border-[#4CAF50] text-white shadow-lg shadow-[#4CAF50]/20"
                        : "border-white/20 text-white/20 hover:border-[#4CAF50]/50 hover:text-[#4CAF50]/50"}`}
                  >
                    ✓
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                    className={`flex-1 bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-transparent transition
                      ${q.correctAnswer === oIndex
                        ? "border-[#4CAF50]/40 focus:ring-[#4CAF50] bg-[#4CAF50]/5"
                        : "border-white/10 focus:ring-[#207D86]"}`}
                  />
                  <span className="text-xs text-slate-600 w-4 font-mono">{String.fromCharCode(65 + oIndex)}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Correct answer:{" "}
              <span className="text-[#4CAF50] font-semibold">Option {String.fromCharCode(65 + q.correctAnswer)}</span>
            </p>
          </div>
        ))}

        {/* ── Bottom Action Bar ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={addQuestion}
            className="py-4 border-2 border-dashed border-[#207D86]/30 rounded-2xl text-[#207D86] hover:border-[#4CAF50]/50 hover:text-[#4CAF50] hover:bg-[#4CAF50]/5 transition font-medium text-sm"
          >
            + Add Question Manually
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="py-4 border-2 border-dashed border-[#207D86]/30 rounded-2xl text-[#207D86] hover:border-[#4CAF50]/50 hover:text-[#4CAF50] hover:bg-[#4CAF50]/5 transition font-medium text-sm flex items-center justify-center gap-2"
          >
            ✨ Import Questions
          </button>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}