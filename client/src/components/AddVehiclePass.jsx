import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Repeat2, Trash2 } from "lucide-react";

import { useAlertStore } from "../stores/alertStore";
import {
  createVehiclePass,
  getVehiclePass,
  updateVehiclePass,
} from "../api/vehiclePasses";
import { getActiveLocations } from "../api";

import Button from "./Button";
import Loading from "./Loading";

import styles from "./AddVehiclePass.module.scss";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TIME_ZONE = "Asia/Tashkent";

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// "YYYY-MM-DDTHH:mm" в зоне парковки — совпадает с тем, что видно в таблице
const toInputValue = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(" ", "T");
};

const AddVehiclePass = ({ id = null, handleClose, onSuccess }) => {
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    plate_number: "",
    location_id: "",
    direction: "entry",
    date: toInputValue(),
  });
  const [locations, setLocations] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [savedPhoto, setSavedPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const fileInputRef = useRef(null);
  const { showAlert } = useAlertStore();
  const { t } = useTranslation();

  useEffect(() => {
    getActiveLocations()
      .then((res) => {
        if (res.success) setLocations(res.data);
      })
      .catch((err) => console.error("Ошибка загрузки локаций:", err.message));
  }, []);

  useEffect(() => {
    if (!id) return;

    let ignore = false;
    setLoading(true);

    getVehiclePass(id)
      .then((res) => {
        if (ignore || !res.success) return;

        setFormData({
          plate_number: res.data.plate_number ?? "",
          location_id: res.data.location_id ?? "",
          direction: res.data.direction ?? "",
          date: toInputValue(res.data.date),
        });
        setSavedPhoto(res.data.photo ?? null);
      })
      .catch((err) => {
        console.error("Ошибка загрузки фиксации:", err.message);
        showAlert(t("error"), "error");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  // освобождаем objectURL превью
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const applyPhoto = (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showAlert(t("photoWrongType"), "error");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      showAlert(t("photoTooLarge"), "error");
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
  };

  const handlePhotoChange = (e) => {
    applyPhoto(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    applyPhoto(e.dataTransfer.files?.[0]);
  };

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    // фото уже в БД — помечаем на удаление при сохранении
    if (savedPhoto) setRemovePhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const payload = {
        plate_number: formData.plate_number.trim(),
        location_id: Number(formData.location_id),
        direction: formData.direction,
        date: formData.date,
      };

      const res = isEdit
        ? await updateVehiclePass(id, { ...payload, remove_photo: removePhoto }, photo)
        : await createVehiclePass(payload, photo);

      if (res.success) {
        showAlert(t("success"), "success");
        onSuccess();
        setTimeout(() => handleClose(), 500);
      }
    } catch (err) {
      console.error("Ошибка при сохранении фиксации:", err.message);
      showAlert(err.response?.data?.error || t("error"), "error");
    } finally {
      setSaving(false);
    }
  };

  // что показываем: новый файл → сохранённое фото → пусто
  const currentPreview =
    photoPreview ||
    (savedPhoto && !removePhoto
      ? `/api/vehicle-passes/image/${savedPhoto}`
      : null);

  if (loading) return <Loading />;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{isEdit ? t("editVehiclePass") : t("addVehiclePass")}</h2>
        <Button text={t("save")} type="submit" loading={saving} />
      </div>

      <div className={styles.row}>
        <div className={styles.fullWidth}>
          <label>{t("plateNumber")}</label>
          <input
            type="text"
            name="plate_number"
            value={formData.plate_number}
            onChange={handleChange}
            placeholder="01A123AA"
            required
          />
        </div>
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
        <div>
          <label>{t("direction")}</label>
          <select
            name="direction"
            value={formData.direction}
            onChange={handleChange}
          >
            {/* у старых записей направление может быть пустым */}
            {!formData.direction && <option value="">—</option>}
            <option value="entry">{t("entry")}</option>
            <option value="exit">{t("exit")}</option>
          </select>
        </div>

        <div>
          <label>{t("date")}</label>
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fullWidth}>
          <label>{t("photo")}</label>

          <input
            ref={fileInputRef}
            className={styles.hiddenInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
          />

          {!currentPreview ? (
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""}`}
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <span className={styles.dropzoneIcon}>
                <ImagePlus size={22} strokeWidth={1.75} />
              </span>
              <span className={styles.dropzoneTitle}>{t("photoDropHint")}</span>
              <span className={styles.dropzoneHint}>JPG · PNG · WEBP — 5 MB</span>
            </div>
          ) : (
            <div className={styles.photoCard}>
              <div className={styles.photoThumb}>
                <img src={currentPreview} alt={t("photo")} />
                <div className={styles.photoOverlay}>
                  <button
                    type="button"
                    className={styles.overlayBtn}
                    onClick={openFilePicker}
                    title={t("photoReplace")}
                  >
                    <Repeat2 size={16} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.overlayBtn} ${styles.overlayBtnDanger}`}
                    onClick={handleRemovePhoto}
                    title={t("delete")}
                  >
                    <Trash2 size={16} strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className={styles.photoMeta}>
                <span
                  className={styles.photoName}
                  title={photo?.name || savedPhoto}
                >
                  {photo ? photo.name : savedPhoto?.split("/").pop()}
                </span>
                <span className={styles.photoSize}>
                  {photo ? formatSize(photo.size) : t("photoSaved")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default AddVehiclePass;
