import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import assignmentService from "../../../services/AssignmentService";

const formatDateTime = (value) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const AssignmentsManage = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
  const [submissionsLoading, setSubmissionsLoading] = useState({});
  const [submissionsDownloading, setSubmissionsDownloading] = useState({});
  const [openSubmissions, setOpenSubmissions] = useState({});

  const loadData = async (q = "") => {
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
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (assignmentId) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this assignment?");
    if (!shouldDelete) return;
    try {
      setError("");
      await assignmentService.deleteAssignment(assignmentId);
      await loadData(searchQuery);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete assignment");
    }
  };

  const handleToggleSubmissions = async (assignmentId) => {
    const isOpen = Boolean(openSubmissions[assignmentId]);

    if (isOpen) {
      setOpenSubmissions((prev) => ({ ...prev, [assignmentId]: false }));
      return;
    }

    setOpenSubmissions((prev) => ({ ...prev, [assignmentId]: true }));

    if (submissionsByAssignment[assignmentId]) {
      return;
    }

    try {
      setSubmissionsLoading((prev) => ({ ...prev, [assignmentId]: true }));
      const submissions = await assignmentService.getAssignmentSubmissions(assignmentId);
      setSubmissionsByAssignment((prev) => ({
        ...prev,
        [assignmentId]: Array.isArray(submissions) ? submissions : [],
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assignment submissions");
    } finally {
      setSubmissionsLoading((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleDownload = async (submission, assignmentId) => {
    if (!submission?.fileUrl) return;
    setError("");
    setSubmissionsDownloading((prev) => ({ ...prev, [submission._id]: true }));
    try {
      const { downloadUrl } = await assignmentService.getSubmissionDownloadUrl(assignmentId, submission._id);
      if (!downloadUrl) throw new Error("Download URL unavailable");

      // Navigate to the signed download URL to let the browser handle the download.
      window.location.assign(downloadUrl);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to download file");
      // Fallback: open original file URL in a new tab
      try {
        window.open(submission.fileUrl, '_blank', 'noopener');
      } catch {
        // ignore
      }
    } finally {
      setSubmissionsDownloading((prev) => ({ ...prev, [submission._id]: false }));
    }
  };

  return (
    <section className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Manage Assignments</h2>
        <p className="text-slate-600 mt-1">Organize, edit, and remove assignments.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#0E2A47]">Your Assignments</h3>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search assignments"
            className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#207D86] focus:border-transparent outline-none"
          />
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-600">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-500">No assignments yet.</div>
        ) : (
          <div className="grid gap-3">
            {assignments.map((assignment) => (
              <article key={assignment._id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{assignment.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {assignment?.module?.name || "Unknown module"} • {assignment?.module?.grade?.name || "No grade"}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-600">Due: {formatDateTime(assignment.dueDate)}</span>
                </div>
                {assignment.description ? (
                  <p className="mt-2 text-sm text-slate-600">{assignment.description}</p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/teacher/assignments/edit/${assignment._id}`)}
                    className="inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(assignment._id)}
                    className="inline-flex items-center px-3 py-1.5 rounded-md border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSubmissions(assignment._id)}
                    className="inline-flex items-center px-3 py-1.5 rounded-md border border-[#207D86] text-[#207D86] text-sm font-medium hover:bg-[#207D86]/10"
                  >
                    {openSubmissions[assignment._id] ? "Hide Submissions" : "View Submissions"}
                  </button>
                </div>

                {openSubmissions[assignment._id] ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <h5 className="text-sm font-semibold text-slate-800">Student Submissions</h5>
                    {submissionsLoading[assignment._id] ? (
                      <p className="mt-2 text-xs text-slate-500">Loading submissions...</p>
                    ) : (submissionsByAssignment[assignment._id] || []).length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">No student submissions yet.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {(submissionsByAssignment[assignment._id] || []).map((submission) => (
                          <div
                            key={submission._id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2"
                          >
                            <div>
                              <p className="text-xs font-medium text-slate-800">
                                {submission?.student?.firstName || "Unknown"} {submission?.student?.lastName || "Student"}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {submission?.student?.regNumber || "No reg number"} • Submitted: {formatDateTime(submission?.submittedAt || submission?.createdAt)}
                              </p>
                            </div>
                            {submission?.fileUrl ? (
                              <button
                                type="button"
                                onClick={() => handleDownload(submission, assignment._id)}
                                disabled={Boolean(submissionsDownloading[submission._id])}
                                className="inline-flex items-center px-2.5 py-1 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                              >
                                {submissionsDownloading[submission._id] ? 'Downloading...' : 'Download Work'}
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AssignmentsManage;
