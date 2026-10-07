import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, X, Plus } from "lucide-react";

import { useAuthStore } from "../stores/authStore";
import { useAlertStore } from "../stores/alertStore";

import {
  getLocation,
  editLocation,
  getLocationTariffHistory,
  addLocationTariffHistory,
  updateLocationTariffHistory,
  deleteLocationTariffHistory,
} from "../api/locations";

import Button from "./Button";
import MapPickerModal from "./MapPickerModal";

import styles from "./AddDoor.module.scss";
import mapStyles from "./AddLocation.module.scss";
import historyStyles from "./EditLocationHistory.module.scss";

const today = () => new Date().toISOString().slice(0, 10);

const EditLocation = ({ id, handleClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    status: "true",
    total_spots: "",
    free_period: "",
    shift_start: "",
    shift_end: "",
    latitude: "",
    longitude: "",
    telegram_chat_ids: [],
  });
  const [telegramInput, setTelegramInput] = useState("");
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingRow, setEditingRow] = useState({});
  const [newEntry, setNewEntry] = useState({ price: "", assigned_at: today() });
  const [addingNew, setAddingNew] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const userSettings = useAuthStore((state) => state.userSettings);
  const { i18n, t } = useTranslation();
  const { showAlert } = useAlertStore();

  useEffect(() => {
    if (userSettings?.language) i18n.changeLanguage(userSettings.language);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationRes, historyRes] = await Promise.all([
          getLocation(id),
          getLocationTariffHistory(id),
        ]);
        if (locationRes.success) {
          setFormData({
            name: locationRes.data.name ?? "",
            status: locationRes.data.status !== undefined ? String(locationRes.data.status) : "true",
            total_spots: locationRes.data.total_spots ?? "",
            free_period: locationRes.data.free_period ?? "",
            shift_start: locationRes.data.shift_start ?? "",
            shift_end: locationRes.data.shift_end ?? "",
            latitude: locationRes.data.latitude ?? "",
            longitude: locationRes.data.longitude ?? "",
            telegram_chat_ids: locationRes.data.telegram_chat_ids ?? [],
          });
        }
        if (historyRes.success) {
          setHistory(historyRes.data);
        }
      } catch (error) {
        console.error(error);
        showAlert(t("error"), "error");
        setTimeout(handleClose, 1500);
      }
    };
    fetchData();
  }, [id]);

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
      const res = await editLocation(id, {
        name: formData.name,
        status: formData.status,
        total_spots: formData.total_spots !== "" ? Number(formData.total_spots) : null,
        free_period: formData.free_period !== "" ? Number(formData.free_period) : null,
        shift_start: formData.shift_start || null,
        shift_end: formData.shift_end || null,
        latitude: formData.latitude !== "" ? formData.latitude : null,
        longitude: formData.longitude !== "" ? formData.longitude : null,
        telegram_chat_ids: formData.telegram_chat_ids,
      });
      if (res.success) {
        showAlert(t("success"), "success");
        onSuccess();
        setTimeout(handleClose, 1000);
      }
    } catch (error) {
      console.error(error);
      showAlert(t("error"), "error");
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditingRow({
      price: entry.tariff?.base_price ?? "",
      assigned_at: entry.assigned_at ? entry.assigned_at.slice(0, 10) : today(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingRow({});
  };

  const saveEdit = async (historyId) => {
    try {
      const res = await updateLocationTariffHistory(id, historyId, {
        price: Number(editingRow.price),
        assigned_at: editingRow.assigned_at,
      });
      if (res.success) {
        const historyRes = await getLocationTariffHistory(id);
        if (historyRes.success) setHistory(historyRes.data);
        setEditingId(null);
        showAlert(t("success"), "success");
      }
    } catch {
      showAlert(t("error"), "error");
    }
  };

  const deleteEntry = async (historyId) => {
    try {
      const res = await deleteLocationTariffHistory(id, historyId);
      if (res.success) {
        setHistory((prev) => prev.filter((h) => h.id !== historyId));
        showAlert(t("success"), "success");
      }
    } catch {
      showAlert(t("error"), "error");
    }
  };

  const saveNewEntry = async () => {
    if (newEntry.price === "") return;
    try {
      const res = await addLocationTariffHistory(id, {
        price: Number(newEntry.price),
        assigned_at: newEntry.assigned_at,
      });
      if (res.success) {
        const historyRes = await getLocationTariffHistory(id);
        if (historyRes.success) setHistory(historyRes.data);
        setAddingNew(false);
        setNewEntry({ price: "", assigned_at: today() });
        showAlert(t("success"), "success");
      }
    } catch {
      showAlert(t("error"), "error");
    }
  };

  const hasCoords = formData.latitude !== "" && formData.longitude !== "";

  return (
    <>
      <form className={styles.addDoor} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h2>{t("editLocation")}</h2>
          <Button text={t("save")} type="submit" />
        </div>

        <div className={styles.row}>
          <div>
            <label htmlFor="name">{t("name")}</label>
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
            <label htmlFor="status">{t("status")}</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="true">{t("enable")}</option>
              <option value="false">{t("disable")}</option>
            </select>
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

        {/* Tariff History */}
        <div className={historyStyles.section}>
          <div className={historyStyles.sectionHeader}>
            <span>{t("tariffHistory")}</span>
            {!addingNew && (
              <button
                type="button"
                className={historyStyles.addBtn}
                onClick={() => setAddingNew(true)}
              >
                + {t("addEntry")}
              </button>
            )}
          </div>

          {addingNew && (
            <div className={historyStyles.newRow}>
              <input
                type="number"
                value={newEntry.price}
                onChange={(e) => setNewEntry((p) => ({ ...p, price: e.target.value }))}
                min="0"
                step="0.01"
                placeholder={t("price")}
              />
              <input
                type="date"
                value={newEntry.assigned_at}
                onChange={(e) => setNewEntry((p) => ({ ...p, assigned_at: e.target.value }))}
                onFocus={(e) => e.target.showPicker?.()}
              />
              <button type="button" className={historyStyles.saveBtn} onClick={saveNewEntry}>
                {t("save")}
              </button>
              <button
                type="button"
                className={historyStyles.cancelBtn}
                onClick={() => {
                  setAddingNew(false);
                  setNewEntry({ price: "", assigned_at: today() });
                }}
              >
                {t("cancel")}
              </button>
            </div>
          )}

          {history.length === 0 && !addingNew ? (
            <p className={historyStyles.empty}>{t("noHistory")}</p>
          ) : (
            <table className={historyStyles.table}>
              <thead>
                <tr>
                  <th>{t("price")}</th>
                  <th>{t("assignedAt")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) =>
                  editingId === entry.id ? (
                    <tr key={entry.id}>
                      <td>
                        <input
                          type="number"
                          value={editingRow.price}
                          onChange={(e) => setEditingRow((p) => ({ ...p, price: e.target.value }))}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={editingRow.assigned_at}
                          onChange={(e) => setEditingRow((p) => ({ ...p, assigned_at: e.target.value }))}
                          onFocus={(e) => e.target.showPicker?.()}
                        />
                      </td>
                      <td className={historyStyles.actions}>
                        <button type="button" className={historyStyles.saveBtn} onClick={() => saveEdit(entry.id)}>
                          {t("save")}
                        </button>
                        <button type="button" className={historyStyles.cancelBtn} onClick={cancelEdit}>
                          {t("cancel")}
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={entry.id}>
                      <td>{entry.tariff?.base_price ?? "—"}</td>
                      <td>{entry.assigned_at ? entry.assigned_at.slice(0, 10) : "—"}</td>
                      <td className={historyStyles.actions}>
                        <button type="button" className={historyStyles.editBtn} onClick={() => startEdit(entry)}>
                          {t("edit")}
                        </button>
                        <button type="button" className={historyStyles.deleteBtn} onClick={() => deleteEntry(entry.id)}>
                          {t("delete")}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
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

export default EditLocation;
