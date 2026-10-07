import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, X, Plus } from "lucide-react";

import { useAuthStore } from "../stores/authStore";
import { useAlertStore } from "../stores/alertStore";

import { addLocation } from "../api/locations";

import Button from "./Button";
import MapPickerModal from "./MapPickerModal";

import styles from "./AddDoor.module.scss";
import mapStyles from "./AddLocation.module.scss";

const AddLocation = ({ handleClose, onSuccess }) => {
  const today = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    assigned_at: today,
    total_spots: "",
    free_period: "",
    shift_start: "",
    shift_end: "",
    latitude: "",
    longitude: "",
    telegram_chat_ids: [],
  });
  const [telegramInput, setTelegramInput] = useState("");
  const [showMap, setShowMap] = useState(false);

  const userSettings = useAuthStore((state) => state.userSettings);
  const { i18n, t } = useTranslation();
  const { showAlert } = useAlertStore();

  useEffect(() => {
    if (userSettings?.language) i18n.changeLanguage(userSettings.language);
  }, [userSettings, i18n]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapConfirm = (lat, lng) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const clearCoords = () => {
    setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
  };

  const addTelegramId = () => {
    const val = telegramInput.trim();
    if (!val || formData.telegram_chat_ids.includes(val)) return;
    setFormData((prev) => ({ ...prev, telegram_chat_ids: [...prev.telegram_chat_ids, val] }));
    setTelegramInput("");
  };

  const removeTelegramId = (id) => {
    setFormData((prev) => ({ ...prev, telegram_chat_ids: prev.telegram_chat_ids.filter((v) => v !== id) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        price: formData.price !== "" ? Number(formData.price) : undefined,
        assigned_at: formData.assigned_at || undefined,
        total_spots: formData.total_spots !== "" ? Number(formData.total_spots) : undefined,
        free_period: formData.free_period !== "" ? Number(formData.free_period) : undefined,
        shift_start: formData.shift_start || undefined,
        shift_end: formData.shift_end || undefined,
        latitude: formData.latitude !== "" ? formData.latitude : undefined,
        longitude: formData.longitude !== "" ? formData.longitude : undefined,
        telegram_chat_ids: formData.telegram_chat_ids,
      };
      const res = await addLocation(payload);
      if (res.success) {
        showAlert(t("success"), "success");
        onSuccess();
        setTimeout(handleClose, 1500);
      }
    } catch (error) {
      console.error(error);
      showAlert(t("error"), "error");
    }
  };

  const hasCoords = formData.latitude !== "" && formData.longitude !== "";

  return (
    <>
      <form className={styles.addDoor} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h2>{t("addLocation")}</h2>
          <Button text={t("save")} type="submit" />
        </div>

        <div className={styles.row}>
          <div>
            <label htmlFor="name">
              {t("name")} <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <label htmlFor="price">{t("price")}</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="assigned_at">{t("assignedAt")}</label>
            <input
              type="date"
              name="assigned_at"
              value={formData.assigned_at}
              onChange={handleChange}
              onFocus={(e) => e.target.showPicker?.()}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <label htmlFor="total_spots">{t("totalSpots")}</label>
            <input
              type="number"
              name="total_spots"
              value={formData.total_spots}
              onChange={handleChange}
              min="1"
              step="1"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="free_period">{t("freePeriod")}</label>
            <input
              type="number"
              name="free_period"
              value={formData.free_period}
              onChange={handleChange}
              min="0"
              step="1"
              placeholder={t("freePeriodMinutes")}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <label htmlFor="shift_start">{t("shiftStart")}</label>
            <input
              type="time"
              name="shift_start"
              value={formData.shift_start}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="shift_end">{t("shiftEnd")}</label>
            <input
              type="time"
              name="shift_end"
              value={formData.shift_end}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <label>{t("telegramChatIds")}</label>
            <div className={mapStyles.telegramRow}>
              <input
                type="text"
                value={telegramInput}
                onChange={(e) => setTelegramInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTelegramId())}
                placeholder={t("enterTelegramId")}
              />
              <button type="button" onClick={addTelegramId}>
                <Plus size={13} />
              </button>
            </div>
            {formData.telegram_chat_ids.length > 0 && (
              <div className={mapStyles.chips}>
                {formData.telegram_chat_ids.map((id) => (
                  <span key={id} className={mapStyles.chip}>
                    {id}
                    <button type="button" onClick={() => removeTelegramId(id)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <label>{t("location")}</label>
            <div className={mapStyles.locationRow}>
              <button
                type="button"
                className={mapStyles.mapBtn}
                onClick={() => setShowMap(true)}
              >
                <MapPin size={13} />
                {t("selectOnMap")}
              </button>
              {hasCoords ? (
                <>
                  <span className={mapStyles.coordsText}>
                    {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}
                  </span>
                  <button type="button" className={mapStyles.clearBtn} onClick={clearCoords}>
                    <X size={12} />
                  </button>
                </>
              ) : (
                <span className={mapStyles.notSet}>{t("locationNotSet")}</span>
              )}
            </div>
          </div>
        </div>
      </form>

      <MapPickerModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={handleMapConfirm}
        initialLat={formData.latitude}
        initialLng={formData.longitude}
      />
    </>
  );
};

export default AddLocation;
