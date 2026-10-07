import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useAlertStore } from "../stores/alertStore";
import { editUser, getUser, getMenus, getUserMenu, uploadUserAvatar, deleteUserAvatar } from "../api";

import Button from "./Button";
import PermissionsManager from "./PermissionsManager";

import styles from "./AddUser.module.scss";

// "HH:mm" для input type=time — сервер хранит час буквально в UTC-полях (без зоны)
const toInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

const EditUser = ({ id, handleClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlertStore();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    status: true,
    telegramId: "",
    can_view_open_parkings: false,
    access_from: "",
    access_until: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [userMenus, setUserMenus] = useState();
  const [allMenus, setAllMenus] = useState();
  const [showPassword, setShowPassword] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, allMenusRes] = await Promise.all([
          getUser(id),
          getMenus(),
        ]);

        const userData = userRes.data;
        const savedMenus = userData.menuAccess || [];

        const menuMap = {};
        savedMenus.forEach((item) => {
          menuMap[item.menu_id] = {
            view: !!item.can_view,
            add: !!item.can_add,
            update: !!item.can_update,
            delete: !!item.can_delete,
          };
        });

        setAllMenus(allMenusRes);
        setUserMenus(
          savedMenus.map((m) => ({
            id: m.menu_id,
            permissions: {
              view: m.can_view,
              add: m.can_add,
              update: m.can_update,
              delete: m.can_delete,
            },
          })),
        );

        setCurrentAvatar(userData.avatar || null);

        setFormData({
          username: userData.username || "",
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          status: userData.status ?? true,
          telegramId: userData.telegram_id || "",
          can_view_open_parkings: !!userData.can_view_open_parkings,
          access_from: toInputValue(userData.access_from),
          access_until: toInputValue(userData.access_until),
          password: "",
          menu: menuMap,
        });
      } catch (error) {
        console.error(error);
        showAlert(t("error"), "error");
        setTimeout(() => handleClose(), 1500);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = ({ target: { name, value } }) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "status" ? value === "true" : value,
    }));
  };

  const handleMenuChange = useCallback((updatedPermissions) => {
    setFormData((prev) => ({ ...prev, menu: updatedPermissions }));
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const handleClearAvatar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAvatarFile(null);
    setAvatarPreview(null);
    setCurrentAvatar(null);
    setRemoveAvatar(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        telegramId: formData.telegramId?.trim() || null,
      };
      const res = await editUser({ id, data: payload });

      if (res.success) {
        if (avatarFile) {
          try {
            await uploadUserAvatar(id, avatarFile);
          } catch {}
        } else if (removeAvatar) {
          try {
            await deleteUserAvatar(id);
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

  const displayAvatar = avatarPreview || currentAvatar;

  return (
    <form className={styles.addUser} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{t("editUser")}</h2>
        <Button text={t("save")} type="submit" disabled={loading} />
      </div>

      <div className={styles.avatarNameRow}>
        <div className={styles.avatarSection}>
          {displayAvatar ? (
            <div className={styles.avatarWrapper} onClick={handleClearAvatar}>
              <img src={displayAvatar} alt="avatar" className={styles.avatarImg} />
              <div className={styles.avatarOverlay}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M9 3V4H4v2h1l1 13h12l1-13h1V4h-5V3H9zm2 5h2v9h-2V8zm-2 0h2v9H9V8zm6 0h2v9h-2V8z" />
                </svg>
              </div>
            </div>
          ) : (
            <label className={styles.avatarWrapper} htmlFor="editAvatarInput">
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
            id="editAvatarInput"
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
          <label>{t("newPassword")}</label>
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
              aria-label={t("show")}
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
        <div>
          <label>{t("status")}</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="true">{t("true")}</option>
            <option value="false">{t("false")}</option>
          </select>
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

export default EditUser;
