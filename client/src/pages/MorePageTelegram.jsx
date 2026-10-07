import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { useAlertStore } from "../stores/alertStore";
import { updateProfile, uploadUserAvatar } from "../api/users";
import { useScreenStack } from "../context/ScreenStackContext";
import styles from "./MorePageTelegram.module.scss";

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PasswordScreen = ({ onClose }) => {
  const { t } = useTranslation();
  const { showAlert } = useAlertStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  const togglePassword = (field) => setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      showAlert(t("passwordMismatch"), "error");
      return;
    }
    try {
      const response = await updateProfile({ currentPassword, newPassword });
      if (response.success) {
        showAlert(t("success"), "success");
        setTimeout(() => onClose(), 800);
      }
    } catch (error) {
      showAlert(error?.response?.data?.error, "error");
    }
  };

  return (
    <div className={styles.screenPage}>
      <div className={styles.screenHeader}>
        <span className={styles.screenTitle}>{t("changePassword")}</span>
      </div>
      <form className={styles.screenBody} onSubmit={handleSubmit}>
        <div className={styles.formCard}>
          <div className={styles.formRow}>
            <label>{t("currentPassword")}</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword.current ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("enterCurrentPassword")}
              />
              <button type="button" className={styles.togglePwd} onClick={() => togglePassword("current")}>
                {showPassword.current ? t("hide") : t("show")}
              </button>
            </div>
          </div>
          <div className={styles.formRow}>
            <label>{t("newPassword")}</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword.new ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("enterNewPassword")}
              />
              <button type="button" className={styles.togglePwd} onClick={() => togglePassword("new")}>
                {showPassword.new ? t("hide") : t("show")}
              </button>
            </div>
          </div>
          <div className={styles.formRow}>
            <label>{t("confirmPassword")}</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmNewPassword")}
              />
              <button type="button" className={styles.togglePwd} onClick={() => togglePassword("confirm")}>
                {showPassword.confirm ? t("hide") : t("show")}
              </button>
            </div>
          </div>
        </div>
        <button type="submit" className={styles.saveBtn}>{t("save")}</button>
      </form>
    </div>
  );
};

const ProfileEditScreen = ({ onClose }) => {
  const { t } = useTranslation();
  const { showAlert } = useAlertStore();
  const { user, loadUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const avatarSrc = avatarPreview || (user?.photo ? `/api/users/image/${user.photo}` : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (avatarFile && user?.id) {
        await uploadUserAvatar(user.id, avatarFile);
      }
      const response = await updateProfile({ first_name: firstName, last_name: lastName });
      if (response.success) {
        await loadUser();
        showAlert(t("success"), "success");
        setTimeout(() => onClose(), 800);
      }
    } catch (error) {
      showAlert(error?.response?.data?.error, "error");
    }
  };

  return (
    <div className={styles.screenPage}>
      <div className={styles.screenHeader}>
        <span className={styles.screenTitle}>{t("profileSettings")}</span>
      </div>
      <form className={styles.screenBody} onSubmit={handleSubmit}>
        <div className={styles.avatarSection} onClick={() => fileInputRef.current?.click()}>
          <div className={styles.avatarWrapper}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className={styles.avatarImage} />
            ) : (
              <span className={styles.avatarInitial}>{user?.first_name?.[0] || "U"}</span>
            )}
            <div className={styles.avatarOverlay}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>
        <div className={styles.formCard}>
          <div className={styles.formRow}>
            <label>{t("firstName")}</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("firstName")} />
          </div>
          <div className={styles.formRow}>
            <label>{t("lastName")}</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("lastName")} />
          </div>
        </div>
        <button type="submit" className={styles.saveBtn}>{t("save")}</button>
      </form>
    </div>
  );
};

const MorePageTelegram = () => {
  const { t } = useTranslation();
  const { pushScreen, popScreen } = useScreenStack();
  const { user, getUserSettings, setUserSettings } = useAuthStore();

  const { theme: storedTheme, language: storedLanguage, fontSize: storedFontSize } = getUserSettings();

  const handleThemeChange = (value) => {
    setUserSettings({ theme: value });
    updateProfile({ theme: value }).catch(() => {});
  };

  const handleLanguageChange = (value) => {
    setUserSettings({ language: value });
    updateProfile({ language: value }).catch(() => {});
  };

  const handleFontSizeChange = (value) => {
    setUserSettings({ fontSize: value });
  };

  const openProfileEdit = () => {
    pushScreen("profile-edit", <ProfileEditScreen onClose={popScreen} />);
  };

  const openPasswordChange = () => {
    pushScreen("password-change", <PasswordScreen onClose={popScreen} />);
  };

  const avatarSrc = user?.photo ? `/api/users/image/${user.photo}` : null;

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        {/* Profile card */}
        <div className={styles.cardList}>
          <div className={styles.list}>
            <div className={styles.listItem} onClick={openProfileEdit}>
              <div className={styles.profileAvatar}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" />
                ) : (
                  <span>{user?.first_name?.[0] || "U"}</span>
                )}
              </div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>{user?.first_name} {user?.last_name}</span>
                <span className={styles.itemSub}>{t("profileSettings")}</span>
              </div>
              <span className={styles.itemChevron}><ChevronRight /></span>
            </div>
          </div>
        </div>

        {/* Appearance settings */}
        <div className={styles.settingsSection}>
          <div className={styles.sectionTitle}>{t("appearance")}</div>
          <div className={styles.settingsCard}>
            <div className={styles.settingsRow}>
              <span className={styles.settingsLabel}>{t("theme")}</span>
              <div className={styles.themePills}>
                <button
                  className={`${styles.pill} ${storedTheme === "light" ? styles.pillActive : ""}`}
                  onClick={() => handleThemeChange("light")}
                >
                  {t("themeLight")}
                </button>
                <button
                  className={`${styles.pill} ${storedTheme === "dark" ? styles.pillActive : ""}`}
                  onClick={() => handleThemeChange("dark")}
                >
                  {t("themeDark")}
                </button>
              </div>
            </div>

            <div className={styles.settingsRow}>
              <span className={styles.settingsLabel}>{t("language")}</span>
              <select
                className={styles.languageSelect}
                value={storedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="ru">{t("languageRussian")}</option>
                <option value="uzCyrl">{t("languageUzbekCyrl")}</option>
                <option value="uzLatn">{t("languageUzbekLatn")}</option>
                <option value="en">{t("languageEnglish")}</option>
              </select>
            </div>

            <div className={`${styles.settingsRow} ${styles.settingsRowStack}`}>
              <span className={styles.settingsLabel}>{t("fontSize")}</span>
              <div className={`${styles.themePills} ${styles.themePillsFull}`}>
                {["small", "medium", "large", "xlarge"].map((size) => (
                  <button
                    key={size}
                    className={`${styles.pill} ${styles.pillFlex} ${storedFontSize === size ? styles.pillActive : ""}`}
                    onClick={() => handleFontSizeChange(size)}
                  >
                    {t(`fontSize${size.charAt(0).toUpperCase() + size.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className={styles.settingsSection}>
          <div className={styles.sectionTitle}>{t("security")}</div>
          <div className={styles.settingsCard}>
            <div className={styles.listItem} onClick={openPasswordChange}>
              <div className={`${styles.itemIcon} ${styles.iconPurple}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>{t("changePassword")}</span>
              </div>
              <span className={styles.itemChevron}><ChevronRight /></span>
            </div>
          </div>
        </div>


        <div className={styles.bottomSpacer} />
      </div>

    </div>
  );
};

export default MorePageTelegram;
