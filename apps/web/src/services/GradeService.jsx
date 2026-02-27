import api from "../api/Axios";

const hasApiV1InBaseUrl = () => {
  const baseURL = api?.defaults?.baseURL || "";
  return /\/api\/v1\/?$/i.test(baseURL);
};

const gradePath = (suffix = "") => {
  const prefix = hasApiV1InBaseUrl() ? "" : "/api/v1";
  return `${prefix}/grades${suffix}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const systemDefaultGrades = Array.from({ length: 13 }, (_, i) => ({
  name: String(i + 1),
  description: `Grade ${i + 1}`,
}));

const gradeService = {
  async getAllGrades() {
    const response = await api.get(gradePath(), { headers: getAuthHeaders() });
    return response.data;
  },

  async createGrade(gradeData) {
    const response = await api.post(gradePath(), gradeData, { headers: getAuthHeaders() });
    return response.data;
  },

  async getGradeById(id) {
    const response = await api.get(gradePath(`/${id}`), { headers: getAuthHeaders() });
    return response.data;
  },

  async updateGrade(id, gradeData) {
    const response = await api.put(gradePath(`/${id}`), gradeData, { headers: getAuthHeaders() });
    return response.data;
  },

  async deleteGrade(id) {
    const response = await api.delete(gradePath(`/${id}`), { headers: getAuthHeaders() });
    return response.data;
  },

  async syncDefaultGrades() {
    // Try backend seed endpoint first; if not available, fallback to client-side sync
    try {
      const resp = await api.post(gradePath("/seed-defaults"), {}, { headers: getAuthHeaders() });
      return resp.data;
    } catch (err) {
      // Fallback: create missing grades client-side
      const existing = await this.getAllGrades();
      const existingNames = new Set((Array.isArray(existing) ? existing : []).map((g) => (g.name || "").trim().toLowerCase()));
      let created = 0;
      for (const g of systemDefaultGrades) {
        const key = g.name.trim().toLowerCase();
        if (existingNames.has(key)) continue;
        await this.createGrade(g);
        created += 1;
      }
      return { message: "Default grades synced (client)", created, updated: 0 };
    }
  },
};

export default gradeService;
