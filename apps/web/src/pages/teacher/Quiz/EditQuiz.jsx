import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Library, GitBranch } from "lucide-react";
import quizService from "../../../services/QuizService.jsx";
import moduleService from "../../../services/ModuleService";

const emptyQuestion = () => ({
	questionText: "",
	options: ["", "", "", ""],
	correctAnswer: 0,
});

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

const Toast = ({ message, type }) => {
	if (!message) return null;
	return (
		<div
			className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-300
			${type === "success"
				? "bg-white border border-emerald-200 text-emerald-700"
				: "bg-white border border-red-200 text-red-700"}`}
		>
			<span className={`w-2 h-2 rounded-full shrink-0 ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
			{message}
		</div>
	);
};

export default function EditQuiz() {
	const navigate = useNavigate();
	const { id } = useParams();

	const [title, setTitle] = useState("");
	const [moduleId, setModuleId] = useState("");
	const [timeLimit, setTimeLimit] = useState(10);
	const [questions, setQuestions] = useState([emptyQuestion()]);

	const [modules, setModules] = useState([]);
	const [loadingModules, setLoadingModules] = useState(true);
	const [moduleError, setModuleError] = useState("");

	const [loadingQuiz, setLoadingQuiz] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [toast, setToast] = useState({ message: "", type: "" });

	const selectedModule = useMemo(
		() => modules.find((m) => String(m._id) === String(moduleId)) || null,
		[modules, moduleId]
	);

	const showToast = (message, type = "success") => {
		setToast({ message, type });
		setTimeout(() => setToast({ message: "", type: "" }), 3000);
	};

	useEffect(() => {
		moduleService.getAllModules()
			.then((data) => setModules(Array.isArray(data) ? data : []))
			.catch(() => setModuleError("Failed to load modules."))
			.finally(() => setLoadingModules(false));
	}, []);

	useEffect(() => {
		const loadQuiz = async () => {
			try {
				setError("");
				const data = await quizService.getTeacherQuizzes();
				const list = Array.isArray(data) ? data : data?.quizzes || [];
				const quiz = list.find((item) => String(item._id) === String(id));

				if (!quiz) {
					setError("Quiz not found.");
					return;
				}

				setTitle(quiz.title || "");
				setModuleId(quiz.moduleId || "");
				setTimeLimit(Number(quiz.timeLimit) || 10);
				setQuestions(
					Array.isArray(quiz.questions) && quiz.questions.length > 0
						? quiz.questions.map((q) => ({
								questionText: q.questionText || "",
								options: Array.isArray(q.options) && q.options.length === 4
									? q.options
									: ["", "", "", ""],
								correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0,
							}))
						: [emptyQuestion()]
				);
			} catch {
				setError("Failed to load quiz details.");
			} finally {
				setLoadingQuiz(false);
			}
		};

		loadQuiz();
	}, [id]);

	const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

	const removeQuestion = (qIndex) => {
		setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
	};

	const updateQuestionText = (qIndex, value) => {
		setQuestions((prev) => {
			const updated = [...prev];
			updated[qIndex] = { ...updated[qIndex], questionText: value };
			return updated;
		});
	};

	const updateOption = (qIndex, oIndex, value) => {
		setQuestions((prev) => {
			const updated = [...prev];
			const opts = [...updated[qIndex].options];
			opts[oIndex] = value;
			updated[qIndex] = { ...updated[qIndex], options: opts };
			return updated;
		});
	};

	const setCorrectAnswer = (qIndex, oIndex) => {
		setQuestions((prev) => {
			const updated = [...prev];
			updated[qIndex] = { ...updated[qIndex], correctAnswer: oIndex };
			return updated;
		});
	};

	const handleSave = async () => {
		setError("");

		if (!title.trim()) return setError("Quiz title is required.");
		if (!moduleId) return setError("Please select a module.");

		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			if (!q.questionText.trim()) return setError(`Question ${i + 1} text is empty.`);
			if (q.options.some((o) => !String(o).trim())) return setError(`All options in Question ${i + 1} must be filled.`);
		}

		try {
			setSaving(true);
			await quizService.updateQuiz(id, {
				title: title.trim(),
				moduleId,
				timeLimit: Number(timeLimit),
				questions,
			});
			showToast("Quiz updated successfully!", "success");
			setTimeout(() => navigate("/teacher/quizzes"), 700);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to update quiz.");
			showToast("Failed to update quiz.", "error");
		} finally {
			setSaving(false);
		}
	};

	if (loadingQuiz) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<div className="flex items-center gap-3 text-[#207D86] font-medium animate-pulse">
					<div className="w-2 h-2 bg-[#207D86] rounded-full animate-bounce" />
					Loading quiz details...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<Toast message={toast.message} type={toast.type} />

			<div className="max-w-3xl mx-auto py-8 px-4 space-y-5">
				<div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
							Edit Quiz
						</h2>
						<p className="text-slate-500 mt-2 text-sm md:text-base">
							Update quiz details and questions before publishing to students.
						</p>
					</div>
					<div className="flex items-center gap-2 self-start">
						<button
							type="button"
							onClick={() => navigate("/teacher/quizzes")}
							className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all active:scale-[0.98]"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSave}
							disabled={saving}
							className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/30 hover:bg-[#18646b] hover:shadow-xl hover:shadow-[#207D86]/40 focus:outline-none focus:ring-4 focus:ring-[#207D86]/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
						<span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
						{error}
					</div>
				)}

				<div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 shadow-xl shadow-slate-200/40">
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1.5">Quiz Title</label>
						<input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Chapter 3 - Algebra Basics"
							className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1.5">Module</label>

						{moduleError && (
							<p className="text-xs text-red-500 mb-2 flex items-center gap-1.5">
								<span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
								{moduleError}
							</p>
						)}

						<div className="relative group">
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
											? ` - ${/grade/i.test(item.grade.name) ? item.grade.name : (/\d/.test(item.grade.name) ? `Grade ${item.grade.name}` : item.grade.name)}`
											: item?.grade
												? ` - ${/grade/i.test(String(item.grade)) ? item.grade : (/\d/.test(String(item.grade)) ? `Grade ${item.grade}` : item.grade)}`
												: ""}
										{isAdvancedModule(item) && item?.subjectStream ? ` - ${item.subjectStream}` : ""}
									</option>
								))}
							</select>

							<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</div>

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

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1.5">
							Time Limit: <span className="text-[#207D86] font-semibold">{timeLimit} minutes</span>
						</label>
						<input
							type="range"
							min={5}
							max={120}
							step={5}
							value={timeLimit}
							onChange={(e) => setTimeLimit(e.target.value)}
							className="w-full accent-[#207D86]"
						/>
						<div className="flex justify-between text-xs text-slate-600 mt-1"><span>5 min</span><span>120 min</span></div>
					</div>
				</div>

				{questions.length > 1 && (
					<div className="flex items-center justify-between px-4 py-2.5 bg-[#207D86]/10 border border-[#207D86]/20 rounded-xl">
						<span className="text-xs text-[#207D86] font-semibold">📋 {questions.length} questions in this quiz</span>
						<button
							onClick={() => setQuestions([emptyQuestion()])}
							className="text-xs text-red-500/70 hover:text-red-600 transition"
						>
							Clear all
						</button>
					</div>
				)}

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
								<button onClick={() => removeQuestion(qIndex)} className="text-xs text-red-500/70 hover:text-red-600 transition">
									✕ Remove
								</button>
							)}
						</div>

						<input
							value={q.questionText}
							onChange={(e) => updateQuestionText(qIndex, e.target.value)}
							placeholder="Enter your question here..."
							className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#207D86]/10 focus:border-[#207D86] transition"
						/>

						<div className="space-y-2">
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options - click ✓ to mark correct answer</p>
							{q.options.map((opt, oIndex) => (
								<div key={oIndex} className="flex items-center gap-3">
									<button
										onClick={() => setCorrectAnswer(qIndex, oIndex)}
										className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition font-bold text-sm
											${q.correctAnswer === oIndex
												? "bg-[#207D86] border-[#207D86] text-white shadow-lg shadow-[#207D86]/20"
												: "border-slate-300 text-slate-400 hover:border-[#207D86]/50 hover:text-[#207D86]/70"}`}
									>
										✓
									</button>
									<input
										value={opt}
										onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
										placeholder={`Option ${oIndex + 1}`}
										className={`flex-1 bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:border-[#207D86] transition
											${q.correctAnswer === oIndex
												? "border-[#207D86]/40 focus:ring-[#207D86]/10 bg-[#207D86]/5"
												: "border-slate-200 focus:ring-[#207D86]/10"}`}
									/>
									<span className="text-xs text-slate-500 w-4 font-mono">{String.fromCharCode(65 + oIndex)}</span>
								</div>
							))}
						</div>

						<p className="text-xs text-slate-500">
							Correct answer: <span className="text-[#207D86] font-semibold">Option {String.fromCharCode(65 + q.correctAnswer)}</span>
						</p>
					</div>
				))}

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<button
						onClick={addQuestion}
						className="py-4 border-2 border-dashed border-[#207D86]/30 rounded-2xl text-[#207D86] hover:border-[#207D86]/60 hover:bg-[#207D86]/5 transition font-medium text-sm"
					>
						+ Add Question
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						className="py-4 rounded-2xl bg-[#207D86] text-white font-semibold shadow-lg shadow-[#207D86]/20 hover:bg-[#18646b] transition disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{saving ? "Saving..." : "Save Changes"}
					</button>
				</div>

				<div className="h-6" />
			</div>
		</div>
	);
}
