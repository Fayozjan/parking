import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAlertStore } from "../stores/alertStore";
import { gatesApi, getActiveLocations } from "../api";

import Button from "./Button";

import styles from "./AddAnprCamera.module.scss";

const EMPTY = {
  name: "",
  location_id: "",
  status: "true",
  coop_enabled: "true",
  coop_window_sec: 15,
  maneuver_window_sec: 60,
};

// Форма ворот: без id — добавление, с id — изменение
const GateForm = ({ id, handleClose, onSuccess }) => {
  const [formData, setFormData] = useState(EMPTY);
  const [locations, setLocations] = useState([]);
  const { showAlert } = useAlertStore();
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      try {
        const [locationsRes, gateRes] = await Promise.all([
          getActiveLocations(),
          id ? gatesApi.getById(id) : null,
        ]);
        if (locationsRes.success) setLocations(locationsRes.data);
        if (gateRes?.success) {
          const g = gateRes.data;
          setFormData({
            name: g.name,
            location_id: g.location_id,
            status: String(g.status),
            coop_enabled: String(g.coop_enabled),
            coop_window_sec: g.coop_window_sec,
            maneuver_window_sec: g.maneuver_window_sec,
          });
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error.message);
        showAlert(t("error"), "error");
        setTimeout(() => handleClose(), 1500);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        status: formData.status === "true",
        coop_enabled: formData.coop_enabled === "true",
      };
      const res = id ? await gatesApi.update(id, payload) : await gatesApi.add(payload);

      if (res.success) {
        showAlert(t("success"), "success");
        onSuccess();
        setTimeout(() => handleClose(), 1500);
      }
    } catch (error) {
      console.error(
        "Ошибка при отправке данных:",
        error.response ? error.response.data : error.message,
      );
      showAlert(error.response?.data?.error || t("error"), "error");
    }
  };

  return (
    <form className={styles.addAnprCamera} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{id ? t("editGate") : t("addGate")}</h2>
        <Button text={t("save")} type={"submit"} />
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("name")}</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>{t("location")}</label>
          <select name="location_id" value={formData.location_id} onChange={handleChange} required>
            <option value="">{t("selectLocations")}</option>
            {locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("coopEnabled")}</label>
          <select name="coop_enabled" value={formData.coop_enabled} onChange={handleChange}>
            <option value="true">{t("enable")}</option>
            <option value="false">{t("disable")}</option>
          </select>
        </div>
        <div>
          <label>{t("status")}</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="true">{t("enable")}</option>
            <option value="false">{t("disable")}</option>
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label title={t("coopWindowHint")}>{t("coopWindowSec")}</label>
          <input
            type="number"
            name="coop_window_sec"
            min={1}
            max={300}
            value={formData.coop_window_sec}
            onChange={handleChange}
          />
        </div>
        <div>
          <label title={t("maneuverWindowHint")}>{t("maneuverWindowSec")}</label>
          <input
            type="number"
            name="maneuver_window_sec"
            min={1}
            max={3600}
            value={formData.maneuver_window_sec}
            onChange={handleChange}
          />
        </div>
      </div>
    </form>
  );
};

export default GateForm;
