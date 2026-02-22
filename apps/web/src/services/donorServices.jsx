import api from "../api/Axios";

// ─── DONOR SERVICES ───────────────────────────────────────────────

export const getAllNeeds = (filters = {}) =>
  api.get("/donations", { params: filters });

export const pledgeDonation = (id) =>
  api.put(`/donations/${id}/pledge`);

export const getMyDonations = () =>
  api.get("/donations/my");

export const markFulfilled = (id) =>
  api.put(`/donations/${id}/complete`);

export const getImpactReport = () =>
  api.get("/donations/impact");