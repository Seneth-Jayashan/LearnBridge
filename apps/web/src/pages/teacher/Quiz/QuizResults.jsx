import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ChevronLeft, Loader2, Users } from "lucide-react";
import quizService from "../../../services/QuizService.jsx";

const formatDate = (dateValue) => {
	if (!dateValue) return "N/A";
	const parsed = new Date(dateValue);
	if (Number.isNaN(parsed.getTime())) return "N/A";
	return parsed.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const getBadgeClassByPercent = (pct) => {
	if (pct >= 70) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
	if (pct >= 40) return "bg-amber-50 text-amber-700 border border-amber-200";
	return "bg-red-50 text-red-700 border border-red-200";
};

export default function QuizResults() {
	const { id } = useParams();
	const navigate = useNavigate();
	const isAllMode = !id;

	const [quiz, setQuiz] = useState(null);
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const loadQuizResults = async () => {
			try {
				setError("");
				setLoading(true);
				const data = isAllMode
					? await quizService.getAllQuizResultsForTeacher()
					: await quizService.getQuizResultsForTeacher(id);
				setQuiz(data?.quiz || null);
				setResults(Array.isArray(data?.results) ? data.results : []);
			} catch (err) {
				setError(err?.response?.data?.message || "Failed to load quiz results.");
			} finally {
				setLoading(false);
			}
		};

		loadQuizResults();
	}, [id, isAllMode]);

	const summary = useMemo(() => {
		if (!results.length) {
			return { attempts: 0, passCount: 0, avgPercent: 0, maxPercent: 0 };
		}

		const percents = results.map((item) => {
			const total = Number(item?.totalQuestions) || 0;
			const score = Number(item?.score) || 0;
			return total > 0 ? (score / total) * 100 : 0;
		});

		const attempts = results.length;
		const passCount = percents.filter((pct) => pct >= 70).length;
		const avgPercent = Math.round(percents.reduce((sum, pct) => sum + pct, 0) / attempts);
		const maxPercent = Math.round(Math.max(...percents));

		return { attempts, passCount, avgPercent, maxPercent };
	}, [results]);

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
				<div className="flex items-center gap-3 text-[#207D86] font-medium animate-pulse">
					<Loader2 className="w-5 h-5 animate-spin" />
					Loading quiz results...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="max-w-5xl mx-auto py-8 px-4">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-3xl font-extrabold text-[#0E2A47] tracking-tight">
							{isAllMode ? "All Quiz Results" : "Quiz Results"}
						</h2>
						<p className="text-slate-500 mt-2 text-sm md:text-base">
							{isAllMode ? "Performance across all your quizzes" : (quiz?.title || "Results for selected quiz")}
						</p>
					</div>
					<button
						onClick={() => navigate("/teacher/quizzes")}
						className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all active:scale-[0.98]"
					>
						<ChevronLeft className="w-4 h-4" />
						Back to Quizzes
					</button>
				</div>

				{error && (
					<div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
						<AlertCircle className="w-4 h-4 shrink-0" />
						{error}
					</div>
				)}

				{!error && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
						<div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-xl shadow-slate-200/40">
							<p className="text-2xl font-black text-slate-800">{summary.attempts}</p>
							<p className="text-xs text-slate-500 mt-1">Attempts</p>
						</div>
						<div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-xl shadow-slate-200/40">
							<p className="text-2xl font-black text-emerald-700">{summary.passCount}</p>
							  <p className="text-xs text-slate-500 mt-1">Passed (&gt;=70%)</p>
						</div>
						<div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-xl shadow-slate-200/40">
							<p className="text-2xl font-black text-[#207D86]">{summary.avgPercent}%</p>
							<p className="text-xs text-slate-500 mt-1">Average</p>
						</div>
						<div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-xl shadow-slate-200/40">
							<p className="text-2xl font-black text-amber-700">{summary.maxPercent}%</p>
							<p className="text-xs text-slate-500 mt-1">Highest</p>
						</div>
					</div>
				)}

				{!error && results.length === 0 ? (
					<div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
						<div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<Users className="w-8 h-8 text-[#207D86]" />
						</div>
						<p className="text-slate-800 font-semibold text-lg mb-1">No attempts yet</p>
						<p className="text-slate-500 text-sm">No student has submitted this quiz yet.</p>
					</div>
				) : !error ? (
					<div className="space-y-3">
						{results.map((item) => {
							const score = Number(item?.score) || 0;
							const total = Number(item?.totalQuestions) || 0;
							const pct = total > 0 ? Math.round((score / total) * 100) : 0;
							const studentName = `${item?.studentId?.firstName || ""} ${item?.studentId?.lastName || ""}`.trim() || "Unknown Student";

							return (
								<div
									key={item._id}
									className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xl shadow-slate-200/40"
								>
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div className="min-w-0">
											<h3 className="text-sm font-semibold text-slate-800 truncate">{studentName}</h3>
											<p className="text-xs text-slate-500 mt-1">
												{item?.studentId?.regNumber || item?.studentId?.email || "Student"}
												<span className="mx-2">·</span>
												Submitted: {formatDate(item?.completedAt || item?.createdAt)}
											</p>
											{isAllMode && (
												<p className="text-xs text-[#207D86] mt-1">
													Quiz: {item?.quizId?.title || "Unknown Quiz"}
												</p>
											)}
											{Array.isArray(item?.flaggedQuestions) && item.flaggedQuestions.length > 0 && (
												<p className="text-xs text-red-600 mt-1">
													Flagged: {item.flaggedQuestions.length} question{item.flaggedQuestions.length > 1 ? "s" : ""}
												</p>
											)}
										</div>
										<div className="flex items-center gap-3 shrink-0">
											<span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getBadgeClassByPercent(pct)}`}>
												{pct}%
											</span>
											<div className="text-right">
												<p className="text-lg font-black text-slate-800">{score}/{total}</p>
												<p className="text-xs text-slate-500">Score</p>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : null}
			</div>
		</div>
	);
}
