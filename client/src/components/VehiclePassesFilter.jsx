import { useState, useEffect, useCallback } from "react";

import { getActiveLocations } from "../api";
import { Icons } from "../icons/icons";

import MultiSelectDoors from "./MultiSelectDoors";

import styles from "./VehiclePassesFilter.module.scss";

const SegmentedGroup = ({ label, options, value, onChange }) => {
  const activeIdx = options.findIndex((o) => o.value === value);
  return (
    <div className={styles.segmentedGroup}>
      {label && <span className={styles.segmentedLabel}>{label}</span>}
      <div className={styles.segmentedTrack}>
        <div
          className={styles.segmentedSlider}
          style={{
            width: `calc(${100 / options.length}% - 4px)`,
            left: `calc(${activeIdx * (100 / options.length)}% + 2px)`,
          }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.segmentedBtn} ${value === opt.value ? styles.segmentedBtnActive : ""}`}
            style={{ color: value === opt.value ? opt.color : undefined }}
            onClick={() => onChange(opt.value)}
          >
            <span
              style={{
                color: opt.color,
                display: "flex",
                alignItems: "center",
              }}
            >
              {opt.icon}
            </span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const DATE_PRESETS = [
  { key: "today", labelKey: "financeToday" },
  { key: "yesterday", labelKey: "financeYesterday" },
  { key: "week", labelKey: "financeLast7" },
  { key: "month", labelKey: "financeThisMonth" },
  { key: "lastMonth", labelKey: "financeLastMonth" },
];

const getPresetDates = (key) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (key === "today") {
    const s = fmt(now);
    return { start_date: `${s} 00:00`, end_date: `${s} 23:59` };
  }
  if (key === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    const s = fmt(d);
    return { start_date: `${s} 00:00`, end_date: `${s} 23:59` };
  }
  if (key === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const d = new Date(now);
    d.setDate(d.getDate() - diff);
    return { start_date: `${fmt(d)} 00:00`, end_date: `${fmt(now)} 23:59` };
  }
  if (key === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start_date: `${fmt(d)} 00:00`, end_date: `${fmt(now)} 23:59` };
  }
  if (key === "lastMonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start_date: `${fmt(first)} 00:00`,
      end_date: `${fmt(last)} 23:59`,
    };
  }
  return {};
};

const FacePassesFilter = ({
  initialFormData,
  formData,
  setFormData,
  onSubmit,
  onApplyPreset,
  t,
}) => {
  const [parkings, setParkings] = useState([]);

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handlePreset = (key) => {
    const dates = getPresetDates(key);
    const newFormData = { ...formData, ...dates };
    setFormData(newFormData);
    if (onApplyPreset) {
      onApplyPreset(newFormData);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getActiveLocations();
        setParkings(data);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err.message);
      }
    };
    fetchData();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  }, []);

  const handleParkingChange = (selectedParkings) => {
    setFormData((prev) => ({
      ...prev,
      selectedLocationIds: selectedParkings,
    }));
  };

  return (
    <form className={styles.filterInline} onSubmit={onSubmit}>
      <div className={styles.presets}>
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={styles.presetBtn}
            onClick={() => handlePreset(p.key)}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      <div className={styles.dateGroup}>
        <input
          className={styles.date}
          type="datetime-local"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          onFocus={(e) => e.target.showPicker?.()}
        />
        <input
          className={styles.date}
          type="datetime-local"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
          onFocus={(e) => e.target.showPicker?.()}
        />
      </div>

      <div className={styles.locationGroup}>
        <MultiSelectDoors
          options={parkings}
          selected={formData.selectedLocationIds || []}
          placeholder={t("selectLocations")}
          onChange={handleParkingChange}
        />
      </div>

      <SegmentedGroup
        label=""
        options={[
          {
            value: "",
            label: t("all"),
            color: "#6b7280",
            icon: Icons.dot,
          },
          {
            value: "entry",
            label: t("entry"),
            color: "#16a34a",
            icon: Icons.arrowForward,
          },
          {
            value: "exit",
            label: t("exit"),
            color: "#dc2626",
            icon: Icons.arrowBack,
          },
        ]}
        value={formData.direction}
        onChange={(val) => setFormData((prev) => ({ ...prev, direction: val }))}
      />

      <div className={styles.actions}>
        <button type="button" onClick={handleReset}>
          {t("clearAll")}
        </button>
        <button type="submit">{t("apply")}</button>
      </div>
    </form>
  );
};

export default FacePassesFilter;
