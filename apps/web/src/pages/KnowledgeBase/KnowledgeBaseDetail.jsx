import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import knowledgeBaseService from "../../services/KnowledgeBaseService";

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
  if (/^blob:/i.test(url)) {
    const blobLink = document.createElement("a");
    blobLink.href = url;
    blobLink.download = fileName || "attachment";
    document.body.appendChild(blobLink);
    blobLink.click();
    document.body.removeChild(blobLink);
    return;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to download file");
  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName || inferFileNameFromUrl(url) || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const KnowledgeBaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        setIsLoading(true);
        const data = await knowledgeBaseService.getPublicEntry(id);
        if (!data) {
          setError("Article not found");
          setEntry(null);
        } else {
          setEntry(data);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load article");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading article...</div>;

  if (error) return (
    <div>
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      <button onClick={() => navigate(-1)} className="mt-3 text-sm text-[#207D86]">Back</button>
    </div>
  );

  if (!entry) return null;

  return (
    <article className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex px-2 py-1 rounded-full bg-[#207D86]/10 text-[#207D86] text-xs font-semibold">{entry.category || "General"}</span>
        <span className="text-xs text-slate-500">Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
      </div>

      <h1 className="text-2xl font-bold text-[#0E2A47]">{entry.title}</h1>
      <div className="mt-2 text-sm text-slate-500">By {entry.authorName || "Teacher"}</div>

      <div className="mt-4 whitespace-pre-line text-slate-700 leading-relaxed">{entry.content}</div>

      {Array.isArray(entry.attachmentUrls) && entry.attachmentUrls.length ? (
        <div className="mt-6 space-y-2">
          <div className="text-sm text-slate-600">Attachments</div>
          {entry.attachmentUrls.map((aUrl, idx) => (
            <div key={idx}>
              <button
                onClick={async () => {
                  try {
                    const kbService = await import("../../services/KnowledgeBaseService");
                    const { downloadUrl, fileName } = await kbService.default.getAttachmentDownloadUrl(entry.id, true, idx);
                    if (downloadUrl) {
                      await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
                      return;
                    }

                    const url = toPublicMediaUrl(aUrl);
                    await downloadFile(url, inferFileNameFromUrl(url));
                  } catch (err) {
                    window.open(aUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="font-semibold text-[#207D86] hover:text-[#14555B]"
              >
                Open attachment {entry.attachmentUrls.length > 1 ? `(${idx + 1})` : ""}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-500">Back to list</button>
      </div>
    </article>
  );
};

export default KnowledgeBaseDetail;
