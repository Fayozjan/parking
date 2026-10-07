import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useAlertStore } from "../stores/alertStore";
import { createVehiclePassesBulk } from "../api/vehiclePasses";
import { getActiveLocations } from "../api";

import Button from "./Button";

import styles from "./AddVehiclePassBulk.module.scss";

const TIME_ZONE = "Asia/Tashkent";

// сегодняшняя дата в зоне парковки — "YYYY-MM-DD"
const todayInZone = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const AddVehiclePassBulk = ({ handleClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    location_id: "",
    date: todayInZone(),
    time_from: "08:00",
    time_to: "20:00",
    count: 50,
  });
  const [locations, setLocations] = useState([]);
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlertStore();
  const { t } = useTranslation();

  useEffect(() => {
    getActiveLocations()
      .then((res) => {
        if (res.success) setLocations(res.data);
      })
      .catch((err) => console.error("Ошибка загрузки локаций:", err.message));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (formData.time_to <= formData.time_from) {
      showAlert(t("bulkTimeRangeInvalid"), "error");
      return;
    }

    setSaving(true);
    try {
      const res = await createVehiclePassesBulk({
        location_id: Number(formData.location_id),
        date: formData.date,
        time_from: formData.time_from,
        time_to: formData.time_to,
        count: Number(formData.count),
      });

      if (res.success) {
        showAlert(`${t("bulkCreated")}: ${res.data.created}`, "success");
        onSuccess();
        setTimeout(() => handleClose(), 500);
      }
    } catch (err) {
      console.error("Ошибка при массовом добавлении:", err.message);
      showAlert(err.response?.data?.error || t("error"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{t("bulkAddVehiclePasses")}</h2>
        <Button text={t("save")} type="submit" loading={saving} />
      </div>

      <div className={styles.row}>
        <div className={styles.fullWidth}>
          <label>{t("location")}</label>
          <select
            name="location_id"
            value={formData.location_id}
            onChange={handleChange}
            required
          >
            <option value="">{t("selectLocations")}</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fullWidth}>
          <label>{t("date")}</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("bulkTimeFrom")}</label>
          <input
            type="time"
            name="time_from"
            value={formData.time_from}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>{t("bulkTimeTo")}</label>
          <input
            type="time"
            name="time_to"
            value={formData.time_to}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fullWidth}>
          <label>{t("bulkCount")}</label>
          <input
            type="number"
            name="count"
            min="1"
            max="5000"
            value={formData.count}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <p className={styles.hint}>{t("bulkHint")}</p>
      </div>
    </form>
  );
};

export default AddVehiclePassBulk;
