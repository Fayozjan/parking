import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Check, X, Folder } from "lucide-react";

import { useAlertStore } from "../stores/alertStore";
import Button from "./Button";
import MultiSelectDoors from "./MultiSelectDoors";
import { FOLDER_ICON_COLOR } from "./WhitelistFolderBar";
import { vehicleWhitelistApi, getActiveLocations } from "../api";
import styles from "./AddVehicleWhitelist.module.scss";

const defaultForm = {
  pattern: "",
  mode: "no_tariff",
  description: "",
  location_ids: [],
  folder_id: "",
  status: true,
};

const AddVehicleWhitelist = ({
  id,
  folders = [],
  defaultFolderId = null,
  onFoldersChange,
  handleClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    ...defaultForm,
    folder_id: defaultFolderId ? String(defaultFolderId) : "",
  });
  const [locations, setLocations] = useState([]);
  const [newFolder, setNewFolder] = useState(null); // { name }
  const [savingFolder, setSavingFolder] = useState(false);
  const { showAlert } = useAlertStore();
  const { t } = useTranslation();

  useEffect(() => {
    getActiveLocations().then((res) => {
      if (res.success) setLocations(res.data);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    vehicleWhitelistApi.getById(id).then((res) => {
      if (res.success && res.data) {
        setFormData({
          pattern: res.data.pattern ?? "",
          mode: res.data.mode ?? "no_tariff",
          description: res.data.description ?? "",
          location_ids: res.data.location_ids ?? [],
          folder_id: res.data.folder_id ? String(res.data.folder_id) : "",
          status: res.data.status ?? true,
        });
      }
    });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  const handleCreateFolder = async () => {
    if (!newFolder?.name.trim() || savingFolder) return;
    setSavingFolder(true);
    try {
      const res = await vehicleWhitelistApi.createFolder({ name: newFolder.name.trim() });
      if (res.success) {
        setFormData((prev) => ({ ...prev, folder_id: String(res.data.id) }));
        setNewFolder(null);
        onFoldersChange?.();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || t("error"), "error");
    } finally {
      setSavingFolder(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        folder_id: formData.folder_id ? Number(formData.folder_id) : null,
        status: formData.status === "true" || formData.status === true,
      };
      const res = id
        ? await vehicleWhitelistApi.update(id, payload)
        : await vehicleWhitelistApi.create(payload);

      if (res.success) {
        showAlert(t("success"), "success");
        onSuccess();
        setTimeout(() => handleClose(), 500);
      }
    } catch (err) {
      console.error("Ошибка при сохранении:", err.message);
      showAlert(t("error"), "error");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{id ? t("editWhitelistEntry") : t("addWhitelistEntry")}</h2>
        <Button text={t("save")} type="submit" />
      </div>

      <div className={styles.row}>
        <div className={styles.fullWidth}>
          <label>{t("whitelistPattern")}</label>
          <input
            type="text"
            name="pattern"
            value={formData.pattern}
            onChange={handleChange}
            placeholder="50A555AA или VSF"
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("whitelistMode")}</label>
          <select name="mode" value={formData.mode} onChange={handleChange}>
            <option value="no_tariff">{t("whitelistModeNoTariff")}</option>
            <option value="hidden">{t("whitelistModeHidden")}</option>
          </select>
        </div>

        <div>
          <label>{t("folder")}</label>
          {newFolder ? (
            <div className={styles.folderCreate}>
              <Folder size={15} color={FOLDER_ICON_COLOR} fill={FOLDER_ICON_COLOR} />
              <input
                autoFocus
                value={newFolder.name}
                onChange={(e) => setNewFolder((prev) => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateFolder();
                  }
                  if (e.key === "Escape") setNewFolder(null);
                }}
                placeholder={t("folderName")}
                maxLength={100}
              />
              <button
                type="button"
                className={styles.folderOk}
                onClick={handleCreateFolder}
                disabled={savingFolder}
              >
                <Check size={18} />
              </button>
              <button type="button" className={styles.folderCancel} onClick={() => setNewFolder(null)}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className={styles.folderSelect}>
              <select name="folder_id" value={formData.folder_id} onChange={handleChange}>
                <option value="">{t("noFolder")}</option>
                {folders.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.folderAdd}
                title={t("addFolder")}
                onClick={() => setNewFolder({ name: "" })}
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fullWidth}>
          <label>{t("locations")}</label>
          <MultiSelectDoors
            options={locations}
            selected={formData.location_ids}
            onChange={(ids) => setFormData((prev) => ({ ...prev, location_ids: ids }))}
            placeholder={t("allLocations")}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fullWidth}>
          <label>{t("description")}</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("status")}</label>
          <select
            name="status"
            value={String(formData.status)}
            onChange={handleChange}
          >
            <option value="true">{t("active")}</option>
            <option value="false">{t("inactive")}</option>
          </select>
        </div>
      </div>
    </form>
  );
};

export default AddVehicleWhitelist;
