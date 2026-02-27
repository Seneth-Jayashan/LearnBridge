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
  content: entry?.content || "",
  category: entry?.category || "General",
  // attachmentUrl kept for backward compatibility (first attachment)
  attachmentUrls: Array.isArray(entry?.attachmentUrl) ? entry.attachmentUrl : (entry?.attachmentUrl ? [entry.attachmentUrl] : []),
  attachmentUrl: Array.isArray(entry?.attachmentUrl) ? (entry.attachmentUrl[0] || "") : (entry?.attachmentUrl || ""),
  isPublished: Boolean(entry?.isPublished),
  authorName: entry?.createdBy
    ? `${entry.createdBy.firstName || ""} ${entry.createdBy.lastName || ""}`.trim() || "Teacher"
    : "Teacher",
  createdAt: entry?.createdAt || "",
  updatedAt: entry?.updatedAt || "",
});

const buildPayload = (payload) => ({
  title: payload.title?.trim() || "",
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

  async getAttachmentDownloadUrl(id, isPublic = false, index = 0) {
    if (!id) return { downloadUrl: "", fileName: "" };
    const query = `?index=${Number(index || 0)}`;
    const endpoint = isPublic ? `${kbPath(`/public/${id}/attachment-download`)}${query}` : `${kbPath(`/${id}/attachment-download`)}${query}`;
    const response = await api.get(endpoint, { headers: getAuthHeaders() });
    return {
      downloadUrl: response.data?.downloadUrl || "",
      fileName: response.data?.fileName || "",
    };
  },

  async getPublicEntry(id) {
    if (!id) return null;
    // Try direct single-entry endpoint first (may not exist on server)
    try {
      const response = await api.get(`${kbPath(`/public/${id}`)}`);
      return mapEntry(response.data || {});
    } catch (err) {
      // fallback: fetch list and find
      try {
        const rows = await this.getPublicEntries();
        return rows.find((r) => r.id === id) || null;
      } catch {
        return null;
      }
    }
  },

  async createEntry(payload) {
    // If payload contains attachment file(s), send FormData
    if (payload && (payload.attachment instanceof File || Array.isArray(payload.attachment))) {
      const form = new FormData();
      const data = buildPayload(payload);
      Object.keys(data).forEach((k) => form.append(k, data[k]));
      if (Array.isArray(payload.attachment)) {
        payload.attachment.forEach((f) => form.append("attachment", f));
      } else {
        form.append("attachment", payload.attachment);
      }
      const response = await api.post(kbPath(), form, buildRequestConfig(form));
      return mapEntry(response.data?.entry || {});
    }

    const response = await api.post(kbPath(), buildPayload(payload), {
      headers: getAuthHeaders(),
    });
    return mapEntry(response.data?.entry || {});
  },

  async updateEntry(id, payload) {
    if (payload && (payload.attachment instanceof File || Array.isArray(payload.attachment))) {
      const form = new FormData();
      const data = buildPayload(payload);
      Object.keys(data).forEach((k) => form.append(k, data[k]));
      if (Array.isArray(payload.attachment)) {
        payload.attachment.forEach((f) => form.append("attachment", f));
      } else {
        form.append("attachment", payload.attachment);
      }
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
