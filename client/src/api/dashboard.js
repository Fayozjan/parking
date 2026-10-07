import api from "./instance";

export const getDashboardAll = async (params = {}) => {
  const res = await api.get("/dashboard/all", { params });
  return res.data.data;
};

export const getDashboardSummary = async () => {
  const res = await api.get("/dashboard/summary");
  return res.data.data;
};

export const getDashboardAnalytics = async (params = {}) => {
  const res = await api.get("/dashboard/analytics", { params });
  return res.data.data;
};

export const getDashboardFeeds = async () => {
  const res = await api.get("/dashboard/feeds");
  return res.data.data;
};

export const getDashboardParkingsByLocation = async (params = {}) => {
  const res = await api.get("/dashboard/parkings-by-location", { params });
  return res.data.data;
};

export const getDashboardFinancialReport = async (params = {}) => {
  const res = await api.get("/dashboard/financial-report", { params });
  return res.data.data;
};

export const getDashboardOccupancyByLocation = async () => {
  const res = await api.get("/dashboard/occupancy-by-location");
  return res.data.data;
};

export const getDashboardLocationCoordinates = async () => {
  const res = await api.get("/dashboard/location-coordinates");
  return res.data.data;
};
