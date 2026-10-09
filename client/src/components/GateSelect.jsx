import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { gatesApi } from "../api";

// Выбор ворот выбранной локации. Нужен в формах камеры: камеры одних ворот работают совместно.
const GateSelect = ({ locationId, value, onChange }) => {
  const { t } = useTranslation();
  const [gates, setGates] = useState([]);

  useEffect(() => {
    if (!locationId) {
      setGates([]);
      return;
    }
    gatesApi
      .get({ pageSize: 200, filters: { location_id: locationId, status: "true" } })
      .then(({ data }) => setGates(data))
      .catch((err) => console.error("Ошибка при получении ворот:", err.message));
  }, [locationId]);

  return (
    <div>
      <label>{t("gate")}</label>
      <select name="gate_id" value={value ?? ""} onChange={onChange} disabled={!locationId}>
        <option value="">{t("noGate")}</option>
        {gates.map((gate) => (
          <option key={gate.id} value={gate.id}>
            {gate.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GateSelect;
