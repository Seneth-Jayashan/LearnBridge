import { useEffect, useMemo, useState } from "react";
import assignmentService from "../../services/AssignmentService";

const toPublicMediaUrl = (value) => {
	if (!value) return "";
	if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
	const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
	const origin = apiBase.replace(/\/api\/v1\/?$/i, "");
	return `${origin}${value.startsWith("/") ? "" : "/"}${value}`;
};

const inferFileNameFromUrl = (url) => {
	if (!url) return "";
	try {
		const parsedUrl = new URL(url);
		const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
		const lastSegment = pathSegments[pathSegments.length - 1] || "";
		return decodeURIComponent(lastSegment).trim();
	} catch {
		return "";
	}
};

const downloadFile = async (url, fileName = "") => {
	if (!url) return;
	const response = await fetch(url);
	if (!response.ok) throw new Error("Failed to download file");
	const fileBlob = await response.blob();
	const objectUrl = URL.createObjectURL(fileBlob);

	try {
		const link = document.createElement("a");
		link.href = objectUrl;
		link.download = fileName || inferFileNameFromUrl(url) || "assignment-material";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	} finally {
		URL.revokeObjectURL(objectUrl);
	}
};

const formatDateTime = (value) => {
	if (!value) return "No due date";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "No due date";
	return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const StudentAssignments = () => {
	const [assignments, setAssignments] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmittingById, setIsSubmittingById] = useState({});
	const [expandedSubmitById, setExpandedSubmitById] = useState({});
	const [submissionFormById, setSubmissionFormById] = useState({});
	const [downloadingMaterialById, setDownloadingMaterialById] = useState({});
	const [error, setError] = useState("");

	const loadAssignments = async (q = "") => {
		try {
			setError("");
			setIsLoading(true);
			const assignmentData = await assignmentService.getAllAssignments({ q });
			setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to load assignments");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadAssignments();
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			loadAssignments(searchQuery);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const totalSubmitted = useMemo(() => {
		return assignments.reduce((total, assignment) => {
			return assignment?.studentSubmission ? total + 1 : total;
		}, 0);
	}, [assignments]);

	const handleOpenSubmit = (assignmentId) => {
		setExpandedSubmitById((prev) => ({ ...prev, [assignmentId]: !prev[assignmentId] }));
		setSubmissionFormById((prev) => {
			if (prev[assignmentId]) return prev;
			return {
				...prev,
				[assignmentId]: {
					notes: "",
					file: null,
				},
			};
		});
	};

	const handleSubmissionFieldChange = (assignmentId, field, value) => {
		setSubmissionFormById((prev) => ({
			...prev,
			[assignmentId]: {
				notes: prev?.[assignmentId]?.notes || "",
				file: prev?.[assignmentId]?.file || null,
				[field]: value,
			},
		}));
	};

	const handleMaterialDownload = async (assignment) => {
		if (!assignment?._id || !assignment?.materialUrl) return;
		try {
			setError("");
			setDownloadingMaterialById((prev) => ({ ...prev, [assignment._id]: true }));
			const { downloadUrl, fileName } = await assignmentService.getMaterialDownloadUrl(assignment._id);
			const resolvedUrl = toPublicMediaUrl(downloadUrl || assignment.materialUrl);
			await downloadFile(resolvedUrl, fileName || inferFileNameFromUrl(resolvedUrl));
		} catch {
			setError("Failed to download assignment material");
		} finally {
			setDownloadingMaterialById((prev) => ({ ...prev, [assignment._id]: false }));
		}
	};

	const refreshSingleAssignmentSubmission = async (assignmentId) => {
		try {
			const latestSubmission = await assignmentService.getMyAssignmentSubmission(assignmentId);
			setAssignments((prev) =>
				prev.map((assignment) => {
					if (String(assignment._id) !== String(assignmentId)) return assignment;
					return { ...assignment, studentSubmission: latestSubmission || null };
				}),
			);
		} catch {
			await loadAssignments(searchQuery);
		}
	};

	const handleSubmitAssignment = async (event, assignment) => {
		event.preventDefault();
		if (!assignment?._id) return;

		const formState = submissionFormById?.[assignment._id] || { notes: "", file: null };
		if (!formState.file) {
			setError("Please attach your assignment work file before submitting");
			return;
		}

		try {
			setError("");
			setIsSubmittingById((prev) => ({ ...prev, [assignment._id]: true }));

			const payload = new FormData();
			payload.append("submission", formState.file);
			if (formState.notes && formState.notes.trim()) {
				payload.append("notes", formState.notes.trim());
			}

			await assignmentService.submitAssignment(assignment._id, payload);
			await refreshSingleAssignmentSubmission(assignment._id);

			setExpandedSubmitById((prev) => ({ ...prev, [assignment._id]: false }));
			setSubmissionFormById((prev) => ({
				...prev,
				[assignment._id]: {
					notes: "",
					file: null,
				},
			}));
		} catch (err) {
			const firstValidationMessage = err?.response?.data?.errors?.[0]?.message;
			setError(firstValidationMessage || err?.response?.data?.message || "Failed to submit assignment");
		} finally {
			setIsSubmittingById((prev) => ({ ...prev, [assignment._id]: false }));
		}
	};

	return (
		<section className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-slate-900">My Assignments</h2>
				<p className="text-sm text-slate-600 mt-1">View assignments and submit your completed work.</p>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<input
					type="search"
					placeholder="Search assignments"
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
					className="w-full sm:w-96 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#207D86] focus:border-transparent outline-none"
				/>
				<div className="text-xs text-slate-600 rounded-lg border border-slate-200 bg-white px-3 py-2">
					Submitted {totalSubmitted} / {assignments.length}
				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
			)}

			{isLoading ? (
				<div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
					Loading assignments...
				</div>
			) : assignments.length === 0 ? (
				<div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
					No assignments available for your grade yet.
				</div>
			) : (
				<div className="grid gap-4">
					{assignments.map((assignment) => {
						const submission = assignment?.studentSubmission || null;
						const submitForm = submissionFormById?.[assignment._id] || { notes: "", file: null };
						const isSubmitting = Boolean(isSubmittingById?.[assignment._id]);
						const isDownloadingMaterial = Boolean(downloadingMaterialById?.[assignment._id]);
						const isSubmitOpen = Boolean(expandedSubmitById?.[assignment._id]);

						return (
							<article
								key={assignment._id}
								className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<h3 className="text-base font-semibold text-slate-900">{assignment.title}</h3>
										<p className="mt-1 text-xs text-slate-500">
											{assignment?.module?.name || "Unknown module"} • {assignment?.module?.grade?.name || "No grade"}
										</p>
									</div>
									<div className="text-right">
										<p className="text-xs font-medium text-slate-600">Due: {formatDateTime(assignment?.dueDate)}</p>
										<p
											className={`mt-1 text-xs font-semibold ${
												submission ? "text-emerald-700" : "text-amber-700"
											}`}
										>
											{submission ? "Submitted" : "Pending"}
										</p>
									</div>
								</div>

								{assignment?.description ? (
									<p className="mt-2 text-sm text-slate-600">{assignment.description}</p>
								) : null}

								<div className="mt-3 text-xs text-slate-500">
									{assignment?.createdBy ? (
										<p>
											Teacher: {assignment.createdBy.firstName || ""} {assignment.createdBy.lastName || ""}
										</p>
									) : null}
									{submission?.submittedAt ? (
										<p>Last submitted: {formatDateTime(submission.submittedAt)}</p>
									) : null}
								</div>

								<div className="mt-4 flex flex-wrap items-center gap-2">
									{assignment?.materialUrl ? (
										<button
											type="button"
											onClick={() => handleMaterialDownload(assignment)}
											disabled={isDownloadingMaterial}
											className="inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
										>
											{isDownloadingMaterial ? "Downloading..." : "Download Material"}
										</button>
									) : null}

									<button
										type="button"
										onClick={() => handleOpenSubmit(assignment._id)}
										className="inline-flex items-center px-3 py-1.5 rounded-md border border-[#207D86] text-[#207D86] text-sm font-medium hover:bg-[#207D86]/10"
									>
										{isSubmitOpen ? "Cancel" : submission ? "Resubmit Work" : "Submit Work"}
									</button>
								</div>

								{isSubmitOpen ? (
									<form
										onSubmit={(event) => handleSubmitAssignment(event, assignment)}
										className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3"
									>
										<div>
											<label
												htmlFor={`submission-file-${assignment._id}`}
												className="block text-xs font-semibold text-slate-700 mb-1"
											>
												Upload Completed Work
											</label>
											<input
												id={`submission-file-${assignment._id}`}
												type="file"
												accept=".pdf,.doc,.docx,.zip,.txt,image/*"
												onChange={(event) =>
													handleSubmissionFieldChange(
														assignment._id,
														"file",
														event.target.files?.[0] || null,
													)
												}
												className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm"
											/>
											{submitForm?.file ? (
												<p className="mt-1 text-xs text-slate-500">Selected: {submitForm.file.name}</p>
											) : null}
										</div>

										<div>
											<label
												htmlFor={`submission-notes-${assignment._id}`}
												className="block text-xs font-semibold text-slate-700 mb-1"
											>
												Notes (optional)
											</label>
											<textarea
												id={`submission-notes-${assignment._id}`}
												rows={3}
												value={submitForm?.notes || ""}
												onChange={(event) =>
													handleSubmissionFieldChange(assignment._id, "notes", event.target.value)
												}
												className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#207D86] focus:border-transparent outline-none"
												placeholder="Add notes for your teacher"
											/>
										</div>

										<button
											type="submit"
											disabled={isSubmitting}
											className="inline-flex items-center px-3.5 py-2 rounded-md bg-[#207D86] text-white text-sm font-semibold hover:bg-[#14555B] disabled:opacity-60"
										>
											{isSubmitting ? "Submitting..." : submission ? "Update Submission" : "Submit Assignment"}
										</button>
									</form>
								) : null}
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
};

export default StudentAssignments;
