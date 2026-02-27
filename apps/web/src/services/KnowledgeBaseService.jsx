import api from "../api/Axios";

const hasApiV1InBaseUrl = () => {
  const baseURL = api?.defaults?.baseURL || "";
  return /\/api\/v1\/?$/i.test(baseURL);
};

const kbPath = (suffix = "") => {
  const prefix = hasApiV1InBaseUrl() ? "" : "/api/v1";
  return `${prefix}/knowledge-base${suffix}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapEntry = (entry) => ({
  id: entry?._id || "",
  title: entry?.title || "",
  summary: entry?.summary || "",
  content: entry?.content || "",
  category: entry?.category || "General",
  attachmentUrl: entry?.attachmentUrl || "",
  isPublished: Boolean(entry?.isPublished),
  authorName: entry?.createdBy
    ? `${entry.createdBy.firstName || ""} ${entry.createdBy.lastName || ""}`.trim() || "Teacher"
    : "Teacher",
  createdAt: entry?.createdAt || "",
  updatedAt: entry?.updatedAt || "",
});

const buildPayload = (payload) => ({
  title: payload.title?.trim() || "",
  summary: payload.summary?.trim() || "",
  content: payload.content?.trim() || "",
  category: payload.category?.trim() || "General",
  isPublished: Boolean(payload.isPublished),
});

const buildRequestConfig = (payload) => {
  const headers = { ...getAuthHeaders() };
  const isFormDataPayload = typeof FormData !== "undefined" && payload instanceof FormData;

  if (!isFormDataPayload) return { headers };

  return {
    headers,
    transformRequest: [
      (data, requestHeaders) => {
        if (requestHeaders) {
          delete requestHeaders["Content-Type"];
          if (requestHeaders.common) delete requestHeaders.common["Content-Type"];
          if (requestHeaders.post) delete requestHeaders.post["Content-Type"];
          if (requestHeaders.put) delete requestHeaders.put["Content-Type"];
        }
        return data;
      },
    ],
  };
};

const knowledgeBaseService = {
  async getAllEntries(query = "") {
    const search = query ? `?q=${encodeURIComponent(query)}` : "";
    const response = await api.get(`${kbPath()}${search}`, { headers: getAuthHeaders() });
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map(mapEntry);
  },

  async getPublicEntries(query = "") {
    const search = query ? `?q=${encodeURIComponent(query)}` : "";
    const response = await api.get(`${kbPath("/public")}${search}`);
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map(mapEntry);
  },

  async getAttachmentDownloadUrl(id, isPublic = false) {
    if (!id) return { downloadUrl: "", fileName: "" };
    const endpoint = isPublic ? `${kbPath(`/public/${id}/attachment-download`)}` : `${kbPath(`/${id}/attachment-download`)}`;
    const response = await api.get(endpoint, { headers: getAuthHeaders() });
    return {
      downloadUrl: response.data?.downloadUrl || "",
      fileName: response.data?.fileName || "",
    };
  },

  async createEntry(payload) {
    // If payload contains an attachment file, send FormData
    if (payload && payload.attachment instanceof File) {
      const form = new FormData();
      const data = buildPayload(payload);
      Object.keys(data).forEach((k) => form.append(k, data[k]));
      form.append("attachment", payload.attachment);
      const response = await api.post(kbPath(), form, buildRequestConfig(form));
      return mapEntry(response.data?.entry || {});
    }

    const response = await api.post(kbPath(), buildPayload(payload), {
      headers: getAuthHeaders(),
    });
    return mapEntry(response.data?.entry || {});
  },

  async updateEntry(id, payload) {
    if (payload && payload.attachment instanceof File) {
      const form = new FormData();
      const data = buildPayload(payload);
      Object.keys(data).forEach((k) => form.append(k, data[k]));
      form.append("attachment", payload.attachment);
      const response = await api.put(`${kbPath()}/${id}`, form, buildRequestConfig(form));
      return mapEntry(response.data?.entry || {});
    }

    const response = await api.put(`${kbPath()}/${id}`, buildPayload(payload), {
      headers: getAuthHeaders(),
    });
    return mapEntry(response.data?.entry || {});
  },

  async deleteEntry(id) {
    await api.delete(`${kbPath()}/${id}`, { headers: getAuthHeaders() });
  },
};

export default knowledgeBaseService;
