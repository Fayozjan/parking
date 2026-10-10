import api from "./instance";

export const getCameraLogs = async (params = {}) => {
  const res = await api.get("/camera-logs", { params });
  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};

export const getCameraLogsStats = async (params = {}) => {
  const res = await api.get("/camera-logs/stats", { params });
  return res.data.data;
};

export const getCamerasList = async () => {
  const res = await api.get("/anpr-cameras/list");
  return res.data.data;
};
