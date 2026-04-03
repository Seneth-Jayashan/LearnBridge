import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import lessonService from "../../../services/LessonService";
import moduleService from "../../../services/ModuleService";

const initialForm = {
  title: "",
  description: "",
  module: "",
  materialUrl: "",
  videoUrl: "",
  zoomStartTime: "",
  isLive: false,
};

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
    blobLink.download = fileName || "material";
    document.body.appendChild(blobLink);
    blobLink.click();
    document.body.removeChild(blobLink);
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to download file");
  }

  const fileBlob = await response.blob();
  const objectUrl = URL.createObjectURL(fileBlob);

  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName || inferFileNameFromUrl(url) || "material";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const LessonsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [mediaFiles, setMediaFiles] = useState({ material: null, video: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setError("");
        const [lessonData, moduleData] = await Promise.all([
          lessonService.getAllLessons(),
          moduleService.getAllModules(),
        ]);

        const lesson = Array.isArray(lessonData) ? lessonData.find((item) => item._id === id) : null;
        if (!lesson) {
          setError("Lesson not found");
          return;
        }

        setModules(Array.isArray(moduleData) ? moduleData : []);
        setFormData({
          title: lesson.title || "",
          description: lesson.description || "",
          module: lesson.module?._id || "",
          materialUrl: toPublicMediaUrl(lesson.materialUrl || ""),
          videoUrl: toPublicMediaUrl(lesson.videoUrl || ""),
          zoomStartTime: toDateTimeLocalValue(lesson.onlineMeeting?.startTime),
          isLive: Boolean(lesson.onlineMeeting && (lesson.onlineMeeting.startTime || lesson.onlineMeeting.joinUrl)),
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load lesson");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    if (!files || files.length === 0) return;

    const file = files[0];
    const objectUrl = URL.createObjectURL(file);

    if (name === "materialUrl") {
      setMediaFiles((prev) => ({ ...prev, material: file }));
      setFormData((prev) => ({ ...prev, materialUrl: objectUrl }));
      return;
    }

    if (name === "videoUrl") {
      setMediaFiles((prev) => ({ ...prev, video: file }));
      setFormData((prev) => ({ ...prev, videoUrl: objectUrl }));
    }
  };

  const handleMaterialDownload = async () => {
    const fallbackUrl = toPublicMediaUrl(formData.materialUrl);
    if (!fallbackUrl) return;
    const isRemoteAsset = /^https?:\/\//i.test(fallbackUrl);

    if (/^blob:/i.test(fallbackUrl) || !id) {
      await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
      return;
    }

    try {
      setError("");
      const { downloadUrl: signedUrl, fileName } = await lessonService.getMaterialDownloadUrl(id);
      const targetUrl = signedUrl || fallbackUrl;
      const targetFileName = fileName || inferFileNameFromUrl(targetUrl);
      await downloadFile(targetUrl, targetFileName);
    } catch {
      if (!isRemoteAsset || /^blob:/i.test(fallbackUrl)) {
        await downloadFile(fallbackUrl, inferFileNameFromUrl(fallbackUrl));
        return;
      }
      setError("Failed to generate secure material link. Please refresh and try again.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) return setError("Lesson title is required");
    if (!formData.module.trim()) return setError("Please select a module");
    if (formData.isLive) {
      if (!formData.materialUrl && !mediaFiles.material) {
        return setError("Live sessions require a lesson material (PDF/Word)");
      }
    } else {
      if (!formData.materialUrl && !formData.videoUrl && !mediaFiles.material && !mediaFiles.video) {
        return setError("Please add at least one lesson resource (document or video)");
      }
    }
    setIsSubmitting(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("module", formData.module);
      payload.append("createZoomMeeting", String(Boolean(formData.isLive)));

      if (formData.isLive && formData.zoomStartTime) {
        payload.append("zoomStartTime", new Date(formData.zoomStartTime).toISOString());
      }

      if (mediaFiles.material) {
        payload.append("material", mediaFiles.material);
      } else if (formData.materialUrl && /^https?:\/\//i.test(formData.materialUrl)) {
        payload.append("materialUrl", formData.materialUrl.trim());
      }

      if (!formData.isLive) {
        if (mediaFiles.video) {
          payload.append("video", mediaFiles.video);
        } else if (formData.videoUrl && /^https?:\/\//i.test(formData.videoUrl)) {
          payload.append("videoUrl", formData.videoUrl.trim());
        }
      }

      await lessonService.updateLesson(id, payload);
      navigate("/teacher/lessons/manage");
    } catch (err) {
      const firstValidationMessage = err.response?.data?.errors?.[0]?.message;
      const backendError = err.response?.data?.error;
      setError(firstValidationMessage || err.response?.data?.message || backendError || "Failed to update lesson");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0E2A47]">Edit Lesson</h2>
        <p className="text-slate-600 mt-1">Update lesson details and resources.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-slate-600">Loading lesson...</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="module" className="block text-sm font-semibold text-slate-700 mb-1">Module</label>
              <select id="module" name="module" value={formData.module} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]">
                <option value="">Select module</option>
                {modules.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">Lesson Title</label>
              <input id="title" name="title" value={formData.title} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]" />
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center">
                <input id="isLive" name="isLive" type="checkbox" checked={formData.isLive} disabled className="sr-only peer" />
                <div className={`w-11 h-6 ${formData.isLive ? 'bg-[#207D86]' : 'bg-gray-200'} rounded-full transition-colors duration-200 ease-in-out`} />
                <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform translate-x-0 transition-transform duration-200 ease-in-out ${formData.isLive ? 'translate-x-5' : ''}`} />
              </label>
              <div>
                <div className="text-sm font-semibold text-slate-700">Online live (Zoom) session</div>
                <div className={formData.isLive ? "text-xs font-medium text-green-600" : "text-xs font-medium text-slate-500"}>
                  {formData.isLive ? "Online — meeting exists (cannot toggle here)" : "Not live — can upload video/material"}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]" />
            </div>

            {formData.isLive && (
              <div className="md:col-span-2 rounded-lg border border-slate-200 p-4 bg-slate-50">
                <label htmlFor="zoomStartTime" className="block text-sm font-semibold text-slate-700 mb-1">
                  Zoom Meeting Date & Time
                </label>
                <input
                  id="zoomStartTime"
                  name="zoomStartTime"
                  type="datetime-local"
                  value={formData.zoomStartTime}
                  onChange={handleInputChange}
                  className="w-full max-w-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
                />
                <p className="text-xs text-slate-600 mt-2">Set a value to create/update Zoom meeting. Clearing it will remove the meeting.</p>
              </div>
            )}

            <div>
              <label htmlFor="materialUrl" className="block text-sm font-semibold text-slate-700 mb-1">Lesson Material (PDF/Word)</label>
              <input id="materialUrl" name="materialUrl" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white" />
              {formData.materialUrl && (
                <button
                  type="button"
                  onClick={handleMaterialDownload}
                  className="inline-flex mt-2 text-sm text-[#207D86] font-semibold hover:text-[#14555B]"
                >
                  Download current material
                </button>
              )}
            </div>

            {!formData.isLive && (
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-semibold text-slate-700 mb-1">Lesson Video (watchable + downloadable)</label>
                <input id="videoUrl" name="videoUrl" type="file" accept="video/*" onChange={handleFileChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white" />
                {formData.videoUrl && (
                  <a href={toPublicMediaUrl(formData.videoUrl)} target="_blank" rel="noopener noreferrer" download className="inline-flex mt-2 text-sm text-[#207D86] font-semibold hover:text-[#14555B]">
                    Download current video
                  </a>
                )}
              </div>
            )}
          </div>

          {!formData.isLive && formData.videoUrl && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Video Preview</p>
              <video controls className="w-full max-h-72 rounded-lg border border-slate-300 bg-black" src={toPublicMediaUrl(formData.videoUrl)} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 rounded-lg bg-[#207D86] text-white font-semibold hover:bg-[#14555B] disabled:opacity-60">
              {isSubmitting ? "Saving..." : "Update Lesson"}
            </button>
            <button type="button" onClick={() => navigate("/teacher/lessons/manage")} className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default LessonsEdit;
