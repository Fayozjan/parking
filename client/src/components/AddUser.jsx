import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useAlertStore } from "../stores/alertStore";
import { getMenus, getUserMenu, addUser, uploadUserAvatar } from "../api";

import Button from "./Button";
import PermissionsManager from "./PermissionsManager";

import styles from "./AddUser.module.scss";

const AddUser = ({ handleClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    telegramId: "",
    can_view_open_parkings: false,
    access_from: "",
    access_until: "",
  });

  const { showAlert } = useAlertStore();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [userMenus, setUserMenus] = useState();
  const [allMenus, setAllMenus] = useState();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userMenu, allMenusRes] = await Promise.all([
          getUserMenu(),
          getMenus(),
        ]);
        setUserMenus(userMenu);
        setAllMenus(allMenusRes);
      } catch (error) {
        console.error(error);
        showAlert(t("error"), "error");
        setTimeout(() => handleClose(), 1500);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMenuChange = (newMenuData) => {
    setFormData((prev) => ({ ...prev, menu: newMenuData }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleClearAvatar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        telegramId: formData.telegramId?.trim() || null,
      };
      const res = await addUser(payload);

      if (res.success) {
        if (avatarFile && res.result?.id) {
          try {
            await uploadUserAvatar(res.result.id, avatarFile);
          } catch {}
        }
        showAlert(t("success"), "success");
        setTimeout(handleClose, 1500);
        onSuccess();
      }
    } catch (error) {
      showAlert(t("error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.addUser} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{t("addUser")}</h2>
        <Button text={t("save")} type="submit" disabled={loading} />
      </div>

      <div className={styles.avatarNameRow}>
        <div className={styles.avatarSection}>
          {avatarPreview ? (
            <div className={styles.avatarWrapper} onClick={handleClearAvatar}>
              <img src={avatarPreview} alt="avatar" className={styles.avatarImg} />
              <div className={styles.avatarOverlay}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M9 3V4H4v2h1l1 13h12l1-13h1V4h-5V3H9zm2 5h2v9h-2V8zm-2 0h2v9H9V8zm6 0h2v9h-2V8z" />
                </svg>
              </div>
            </div>
          ) : (
            <label className={styles.avatarWrapper} htmlFor="addAvatarInput">
              <div className={styles.avatarPlaceholder}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <div className={styles.avatarOverlay}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M9 2L7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
                  <circle cx="12" cy="12" r="3.2" />
                </svg>
              </div>
            </label>
          )}
          <input
            id="addAvatarInput"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className={styles.avatarInput}
          />
        </div>

        <div className={styles.nameFields}>
          <div>
            <label>{t("firstName")}</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>{t("lastName")}</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>
            {t("username")} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>{t("password")}</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.passwordInput}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className={styles.togglePassword}
            >
              {showPassword ? t("hide") : t("show")}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("telegramId")}</label>
          <input
            type="text"
            name="telegramId"
            value={formData.telegramId}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("accessFrom")}</label>
          <input
            type="time"
            name="access_from"
            value={formData.access_from}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>{t("accessUntil")}</label>
          <input
            type="time"
            name="access_until"
            value={formData.access_until}
            onChange={handleChange}
          />
        </div>
      </div>

      <PermissionsManager
        allMenus={allMenus}
        userMenus={userMenus}
        onChange={handleMenuChange}
      />

      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.can_view_open_parkings}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                can_view_open_parkings: e.target.checked,
              }))
            }
          />
          {t("canViewOpenParkings")}
        </label>
      </div>
    </form>
  );
};

export default AddUser;
