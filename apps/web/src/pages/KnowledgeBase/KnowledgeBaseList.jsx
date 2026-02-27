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

const KnowledgeBaseList = ({ entries, emptyMessage = "No articles available yet." }) => {
  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {entries.map((entry) => (
        <article key={entry.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex px-2 py-1 rounded-full bg-[#207D86]/10 text-[#207D86] text-xs font-semibold">
              {entry.category || "General"}
            </span>
            <span className="text-xs text-slate-500">Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
          </div>
          <h3 className="text-xl font-bold text-[#0E2A47]">{entry.title}</h3>
          {entry.summary && <p className="mt-2 text-slate-600">{entry.summary}</p>}
          <p className="mt-3 whitespace-pre-line text-slate-700 leading-relaxed">{entry.content}</p>
          <div className="mt-4 flex flex-wrap gap-3 items-center text-sm">
            <span className="text-slate-500">By {entry.authorName || "Teacher"}</span>
            {entry.attachmentUrl ? (
              <button
                onClick={async () => {
                  try {
                    // try to get a signed download URL for public KB entries
                    const kbService = await import("../../services/KnowledgeBaseService");
                    const { downloadUrl, fileName } = await kbService.default.getAttachmentDownloadUrl(entry.id, true);
                    if (downloadUrl) {
                      await downloadFile(downloadUrl, fileName || inferFileNameFromUrl(downloadUrl));
                      return;
                    }

                    // fallback: direct public URL
                    const url = toPublicMediaUrl(entry.attachmentUrl);
                    await downloadFile(url, inferFileNameFromUrl(url));
                  } catch (err) {
                    // final fallback: open in new tab
                    window.open(entry.attachmentUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="font-semibold text-[#207D86] hover:text-[#14555B]"
              >
                Open attachment
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
};

export default KnowledgeBaseList;
