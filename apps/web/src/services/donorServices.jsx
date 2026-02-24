import api from "../api/Axios";

// ─── DONOR SERVICES ───────────────────────────────────────────────

export const getAllNeeds = (filters = {}) =>
  api.get("/donor", { params: filters });

export const pledgeDonation = (id) =>
  api.put(`/donor/${id}/pledge`);

export const getMyDonations = () =>
  api.get("/donor/my");

export const markFulfilled = (id) =>
  api.put(`/donor/${id}/complete`);

export const getImpactReport = () =>
  api.get("/donor/impact");

export const getDonorProfile = () =>
  api.get("/donor/profile");

export const updateDonorProfile = (data) =>
  api.put("/donor/profile", data);

export const changePassword = (data) =>
  api.put("/donor/profile/change-password", data);

export const createNeed = (data) =>
  api.post("/school-admin/needs", data);

export const getMyPostedNeeds = () =>
  api.get("/school-admin/school/my-needs");

export const updateNeed = (id, data) =>
  api.put(`/school-admin/school/${id}`, data);

export const deleteNeed = (id) =>
  api.delete(`/school-admin/school/${id}`);