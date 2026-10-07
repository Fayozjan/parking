import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Folder, FolderOpen, Plus, Pencil, Trash2, Check, X, Files } from "lucide-react";

import { vehicleWhitelistApi } from "../api";
import CenterModal from "./CenterModal";
import { useAlertStore } from "../stores/alertStore";
import styles from "./WhitelistFolderBar.module.scss";

export const FOLDER_ICON_COLOR = "#eab308";

const WhitelistFolderBar = ({
  folders,
  activeFolder,
  onSelect,
  onFoldersChange,
  totalCount,
  uncategorizedCount,
  canAdd,
  canEdit,
  canDelete,
}) => {
  const { t } = useTranslation();
  const { showAlert } = useAlertStore();

  const [editing, setEditing] = useState(null); // { id: number | "new", name }
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startCreate = () => setEditing({ id: "new", name: "" });

  const startRename = (folder) => setEditing({ id: folder.id, name: folder.name });

  const handleSave = async () => {
    if (!editing?.name.trim() || saving) return;
    setSaving(true);
    try {
      const body = { name: editing.name.trim() };
      const res =
        editing.id === "new"
          ? await vehicleWhitelistApi.createFolder(body)
          : await vehicleWhitelistApi.updateFolder(editing.id, body);
      if (res.success) {
        showAlert(t("success"), "success");
        setEditing(null);
        onFoldersChange();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || t("error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (folder) => {
    setDeleteTarget(null);
    try {
      const res = await vehicleWhitelistApi.removeFolder(folder.id);
      if (res.success) {
        showAlert(t("success"), "success");
        // сброс фильтра сам перезапрашивает список и папки — иначе двойной fetch со старым folder_id
        if (String(activeFolder) === String(folder.id)) onSelect("");
        else onFoldersChange();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || t("error"), "error");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") setEditing(null);
  };

  const renderEditor = () => (
    <div className={styles.editor}>
      <Folder size={14} color={FOLDER_ICON_COLOR} fill={FOLDER_ICON_COLOR} />
      <input
        ref={inputRef}
        value={editing.name}
        onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
        onKeyDown={handleKeyDown}
        placeholder={t("folderName")}
        maxLength={100}
      />
      <button type="button" className={styles.iconOk} onClick={handleSave} disabled={saving}>
        <Check size={17} />
      </button>
      <button type="button" className={styles.iconCancel} onClick={() => setEditing(null)}>
        <X size={17} />
      </button>
    </div>
  );

  return (
    <div className={styles.folderBar}>
      <button
        type="button"
        className={`${styles.chip} ${activeFolder === "" ? styles.chipActive : ""}`}
        onClick={() => onSelect("")}
      >
        <Files size={14} />
        <span className={styles.chipName}>{t("allFolders")}</span>
        <span className={styles.chipCount}>{totalCount}</span>
      </button>

      <button
        type="button"
        className={`${styles.chip} ${activeFolder === "null" ? styles.chipActive : ""}`}
        onClick={() => onSelect("null")}
      >
        <Folder size={14} />
        <span className={styles.chipName}>{t("noFolder")}</span>
        <span className={styles.chipCount}>{uncategorizedCount}</span>
      </button>

      <span className={styles.divider} />

      {folders.map((folder) => {
        const isActive = String(activeFolder) === String(folder.id);

        return editing?.id === folder.id ? (
          <div key={folder.id}>{renderEditor()}</div>
        ) : (
          <div key={folder.id} className={styles.chipWrap}>
            <button
              type="button"
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              onClick={() => onSelect(String(folder.id))}
              title={folder.name}
            >
              {isActive ? (
                <FolderOpen size={14} color={FOLDER_ICON_COLOR} />
              ) : (
                <Folder size={14} color={FOLDER_ICON_COLOR} fill={FOLDER_ICON_COLOR} />
              )}
              <span className={styles.chipName}>{folder.name}</span>
              <span className={styles.chipCount}>{folder.count ?? 0}</span>
            </button>
            {(canEdit || canDelete) && (
              <span className={styles.chipActions}>
                {canEdit && (
                  <button type="button" onClick={() => startRename(folder)} title={t("edit")}>
                    <Pencil size={12} />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => setDeleteTarget(folder)}
                    title={t("delete")}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </span>
            )}
          </div>
        );
      })}

      {editing?.id === "new" && renderEditor()}

      {canAdd && !editing && (
        <button type="button" className={styles.addChip} onClick={startCreate} title={t("addFolder")}>
          <Plus size={14} />
          <span>{t("addFolder")}</span>
        </button>
      )}

      <CenterModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onAccept={() => handleDelete(deleteTarget)}
        tag={t("areYouSureDeleteFolder")}
      />
    </div>
  );
};

export default WhitelistFolderBar;
