import api from "./instance";

export const getFinanceSummary = async (params = {}) => {
  const res = await api.get("/finance/summary", { params });
  return res.data.data;
};

export const getFinanceLocationParkings = async (params = {}) => {
  const res = await api.get("/finance/location-parkings", { params });
  return res.data.data;
};

export const closeFinanceParking = async ({ locationId, plateNumber, date }) => {
  const res = await api.post("/finance/close-parking", { locationId, plateNumber, date });
  return res.data.data;
};

export const cancelFinanceParking = async ({ exitId }) => {
  const res = await api.delete(`/finance/close-parking/${exitId}`);
  return res.data;
};
