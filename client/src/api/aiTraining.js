import api from "./instance";

export const getAiTrainingSummary = async () => {
  const res = await api.get("/ai-training/summary");
  return res.data;
};

// Что скачается этим запросом: { count, first_id, last_id, has_more }. Заодно обновляет токен до скачивания файла.
export const getAiTrainingPlan = async (params = {}) => {
  const res = await api.get("/ai-training/plan", { params });
  return res.data;
};

// Ссылка на zip: браузер качает файл сам (cookie с токеном уходит вместе с запросом)
export const aiTrainingExportUrl = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  return `/api/ai-training/export?${query}`;
};
