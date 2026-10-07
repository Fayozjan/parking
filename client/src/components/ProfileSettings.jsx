import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAlertStore } from "../stores/alertStore";
import { useAuthStore } from "../stores/authStore";
import { updateProfile, uploadUserAvatar } from "../api/users";

import styles from "./ProfileSettings.module.scss";

const ProfileSettings = ({ onClose }) => {
  const { t } = useTranslation();
  const { getUserSettings, setUserSettings, user, loadUser } = useAuthStore();
  const { showAlert } = useAlertStore();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    theme: storedTheme,
    language: storedLanguage,
    fontSize: storedFontSize,
    sidebar,
  } = getUserSettings();

  const [theme, setTheme] = useState(storedTheme || "light");
  const [language, setLanguage] = useState(storedLanguage || "ru");
  const [fontSize, setFontSize] = useState(storedFontSize || "medium");

  const handleFontSizeChange = (value) => {
    setFontSize(value);
    setUserSettings({ fontSize: value });
  };

  const fileInputRef = useRef(null);

  const togglePassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showAlert(t("passwordMismatch"), "error");
      return;
    }

    try {
      if (avatarFile && user?.id) {
        await uploadUserAvatar(user.id, avatarFile);
      }

      const response = await updateProfile({
        currentPassword,
        newPassword,
        theme,
        language,
        first_name: firstName,
        last_name: lastName,
      });

      if (response.success) {
        setUserSettings({ theme, language, sidebar });
        await loadUser();
        showAlert(t("success"), "success");
        setTimeout(() => onClose(), 1000);
      }
    } catch (error) {
      console.log(error);
      showAlert(error?.response?.data?.error, "error");
    }
  };

  const avatarSrc = avatarPreview || (user?.photo ? `/api/users/image/${user.photo}` : null);

  return (
    <div className={styles.profileSettings}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.avatarSection}>
          <div
            className={styles.avatarWrapper}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className={styles.avatarImage} />
            ) : (
              <span className={styles.avatarInitial}>
                {user?.first_name?.[0] || "U"}
              </span>
            )}
            <div className={styles.avatarOverlay}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>

        <div className={styles.flex}>
          <div className={styles.inputGroup}>
            <label>{t("firstName")}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("firstName")}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>{t("lastName")}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("lastName")}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>{t("currentPassword")}</label>
          <input
            type={showPassword.current ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("enterCurrentPassword")}
          />
          <span
            className={styles.togglePassword}
            onClick={() => togglePassword("current")}
          >
            {showPassword.current ? t("hide") : t("show")}
          </span>
        </div>

        <div className={styles.inputGroup}>
          <label>{t("newPassword")}</label>
          <input
            type={showPassword.new ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("enterNewPassword")}
          />
          <span
            className={styles.togglePassword}
            onClick={() => togglePassword("new")}
          >
            {showPassword.new ? t("hide") : t("show")}
          </span>
        </div>

        <div className={styles.inputGroup}>
          <label>{t("confirmPassword")}</label>
          <input
            type={showPassword.confirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmNewPassword")}
          />
          <span
            className={styles.togglePassword}
            onClick={() => togglePassword("confirm")}
          >
            {showPassword.confirm ? t("hide") : t("show")}
          </span>
        </div>

        <div className={styles.flex}>
          <div className={styles.inputGroup}>
            <label>{t("theme")}</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">{t("themeLight")}</option>
              <option value="dark">{t("themeDark")}</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>{t("language")}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="ru">{t("languageRussian")}</option>
              <option value="uzCyrl">{t("languageUzbekCyrl")}</option>
              <option value="uzLatn">{t("languageUzbekLatn")}</option>
              <option value="en">{t("languageEnglish")}</option>
            </select>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>{t("fontSize")}</label>
          <div className={styles.fontSizeGroup}>
            {["small", "medium", "large", "xlarge"].map((size) => (
              <button
                key={size}
                type="button"
                className={`${styles.fontSizeBtn} ${fontSize === size ? styles.fontSizeBtnActive : ""}`}
                onClick={() => handleFontSizeChange(size)}
              >
                {t(`fontSize${size.charAt(0).toUpperCase() + size.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className={styles.saveButton}>
          {t("save")}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;
