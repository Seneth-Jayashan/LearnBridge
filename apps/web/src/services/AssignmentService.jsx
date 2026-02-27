import api from "../api/Axios";

const hasApiV1InBaseUrl = () => {
  const baseURL = api?.defaults?.baseURL || "";
  return /\/api\/v1\/?$/i.test(baseURL);
};

const assignmentPath = (id = "") => {
  const prefix = hasApiV1InBaseUrl() ? "" : "/api/v1";
  return `${prefix}/assignments${id ? `/${id}` : ""}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildRequestConfig = (payload) => {
  const headers = { ...getAuthHeaders() };
  const isFormDataPayload = typeof FormData !== "undefined" && payload instanceof FormData;

  if (!isFormDataPayload) {
    return { headers };
  }

  // For FormData we must not force a JSON Content-Type. Let the browser
  // set the correct multipart/form-data boundary. Setting Content-Type to
  // undefined ensures axios does not override it with the default JSON header.
  return { headers: { ...headers, "Content-Type": undefined } };
};

const assignmentService = {
  async getAllAssignments(params = {}) {
    const query = new URLSearchParams();
    if (params.moduleId) query.set("module", params.moduleId);
    if (params.q) query.set("q", params.q);
    const endpoint = query.toString()
      ? `${assignmentPath()}?${query.toString()}`
      : assignmentPath();
    const response = await api.get(endpoint, { headers: getAuthHeaders() });
    return response.data;
  },

  async createAssignment(payload) {
    const response = await api.post(
      assignmentPath(),
      payload,
      buildRequestConfig(payload),
    );
    return response.data;
  },

  async getAssignmentById(id) {
    const response = await api.get(assignmentPath(id), { headers: getAuthHeaders() });
    return response.data;
  },

  async updateAssignment(id, payload) {
    const response = await api.put(
      assignmentPath(id),
      payload,
      buildRequestConfig(payload),
    );
    return response.data;
  },

  async deleteAssignment(id) {
    const response = await api.delete(assignmentPath(id), { headers: getAuthHeaders() });
    return response.data;
  },

  async getMaterialDownloadUrl(id) {
    const response = await api.get(`${assignmentPath(id)}/material-download`, {
      headers: getAuthHeaders(),
    });
    return {
      downloadUrl: response.data?.downloadUrl || "",
      fileName: response.data?.fileName || "",
    };
  },

  async submitAssignment(id, payload) {
    const response = await api.post(
      `${assignmentPath(id)}/submit`,
      payload,
      buildRequestConfig(payload),
    );
    return response.data;
  },

  async getMyAssignmentSubmission(id) {
    const response = await api.get(`${assignmentPath(id)}/my-submission`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getAssignmentSubmissions(id) {
    const response = await api.get(`${assignmentPath(id)}/submissions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getSubmissionDownloadUrl(assignmentId, submissionId) {
    const response = await api.get(`${assignmentPath(assignmentId)}/submissions/${submissionId}/download`, {
      headers: getAuthHeaders(),
    });
    return {
      downloadUrl: response.data?.downloadUrl || "",
      fileName: response.data?.fileName || "",
    };
  },
};

export default assignmentService;
