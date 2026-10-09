import { useState, useEffect, useRef, Fragment } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";

import { usePermissions } from "../hooks/usePermissions";
import { vehicleWhitelistApi, getActiveLocations } from "../api";
import { useAlertStore } from "../stores/alertStore";

import Button from "../components/Button";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import SortArrow from "../components/SortArrow";
import CenterModal from "../components/CenterModal";
import OverlaySidebar from "../components/OverlaySidebar";
import Search from "../components/Search";
import DownloadButton from "../components/DownloadButton";
import AddVehicleWhitelist from "../components/AddVehicleWhitelist";
import WhitelistFolderBar, { FOLDER_ICON_COLOR } from "../components/WhitelistFolderBar";

import styles from "./VehicleWhitelistPage.module.scss";
import { ActionCell } from "../components/ActionButtons";
import PageHero from "../components/PageHero";
import {
  ShieldCheck,
  ShieldOff,
  List,
  FileDown,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react";
import { Icons } from "../icons/icons";

const StatWidget = ({ icon: Icon, color, label, value, sub, progress }) => (
  <div className={styles.statWidget}>
    <div className={styles.statWidgetInner}>
      <div className={styles.statWidgetIcon} style={{ background: color + "18" }}>
        <Icon size={15} color={color} strokeWidth={2} />
      </div>
      <div className={styles.statWidgetContent}>
        <span className={styles.statWidgetLabel}>{label}</span>
        <span className={styles.statWidgetValue} style={{ color }}>
          {value}
          {sub && <span className={styles.statWidgetSub}> {sub}</span>}
        </span>
      </div>
    </div>
    {progress != null && (
      <div className={styles.statWidgetProgressTrack}>
        <div
          className={styles.statWidgetProgressFill}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: color }}
        />
      </div>
    )}
  </div>
);

const VehicleWhitelistPage = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState("added_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({ search: "", status: "", folder_id: "" });
  const [locations, setLocations] = useState([]);

  const [folders, setFolders] = useState([]);
  const [folderStats, setFolderStats] = useState({ total: 0, uncategorized: 0 });
  const [groupByFolder, setGroupByFolder] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState([]); // по умолчанию все папки свёрнуты

  const { t } = useTranslation();
  const currentPath = window.location.pathname;
  const { canAdd, canEdit, canDelete } = usePermissions(currentPath);
  const { showAlert } = useAlertStore();
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    getActiveLocations().then((res) => {
      if (res.success) setLocations(res.data);
    });
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await vehicleWhitelistApi.getFolders();
      if (res.success) {
        setFolders(res.data.folders || []);
        setFolderStats({ total: res.data.total || 0, uncategorized: res.data.uncategorized || 0 });
      }
    } catch (err) {
      console.error("Ошибка при получении папок:", err.message);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchData = async (page = currentPage, filters = formData, size = pageSize, grouped = groupByFolder) => {
    setLoading(true);
    try {
      const res = await vehicleWhitelistApi.getAll({
        page: grouped ? 1 : page,
        pageSize: grouped ? "all" : size,
        ...filters,
      });
      if (res.success) {
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setCurrentPage(res.pagination.currentPage);
        setTotalItems(res.pagination.totalItems);
      }
    } catch (err) {
      console.error("Ошибка при получении данных:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    fetchData();
    fetchFolders();
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, pageSize, groupByFolder]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleChangePageSize = (e) => {
    const size = parseInt(e.target.value, 10);
    setPageSize(size);
    setCurrentPage(Math.min(currentPage, Math.ceil(totalItems / size)));
  };

  const handleEditClick = (id) => {
    setSelectedItem(id);
    setModalType("edit");
  };

  const handleDeleteClick = (id) => {
    setSelectedItem(id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await vehicleWhitelistApi.remove(id);
      setShowModal(false);
      refreshAll();
    } catch (err) {
      console.error("Ошибка при удалении:", err.message);
    }
  };

  const handleSearch = (data = formData) => {
    setCurrentPage(1);
    fetchData(1, data, pageSize);
  };

  const handleSelectFolder = (folderId) => {
    const updated = { ...formData, folder_id: folderId };
    setFormData(updated);
    handleSearch(updated);
    fetchFolders();
  };

  const toggleGroup = (key) =>
    setExpandedGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const getSortedData = () => {
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Explorer-стиль: сначала папки, последней группой — «Без папки»
  const getGroups = () => {
    const map = new Map();
    getSortedData().forEach((item) => {
      const key = item.folder_id != null ? String(item.folder_id) : "null";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });

    // пустые папки показываем только когда фильтры сброшены — иначе список забит пустыми ветками
    const showEmpty = !formData.folder_id && !formData.search?.trim() && !formData.status;

    const groups = folders
      .map((f) => ({ key: String(f.id), name: f.name, items: map.get(String(f.id)) || [] }))
      .filter((g) => showEmpty || g.items.length);

    const rootItems = map.get("null") || [];
    if (rootItems.length) {
      groups.push({ key: "null", name: t("noFolder"), items: rootItems, isRoot: true });
    }

    return groups;
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["pattern", "mode", "description"],
      ["ABC123", "no_tariff", "Пример VIP"],
      ["01", "hidden", "Пример скрытого"],
    ]);
    ws["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "whitelist");
    XLSX.writeFile(wb, "whitelist_template.xlsx");
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const targetFolder =
        formData.folder_id && formData.folder_id !== "null" ? formData.folder_id : null;
      const res = await vehicleWhitelistApi.importFromExcel(file, targetFolder);
      if (res.success) {
        showAlert(`${t("importSuccess")}: ${res.data.imported}`, "success");
        refreshAll();
      }
    } catch (err) {
      showAlert(t("importError"), "error");
    } finally {
      setImporting(false);
    }
  };

  const activeFolder = folders.find((f) => String(f.id) === String(formData.folder_id));
  const noTariffCount = data.filter((x) => x.mode === "no_tariff").length;
  const hiddenCount = data.filter((x) => x.mode === "hidden").length;
  const showFolderColumn = !groupByFolder;
  const colCount = 6 + (showFolderColumn ? 1 : 0) + (canEdit || canDelete ? 1 : 0);

  const renderRow = (item, rowNumber, nested = false) => (
    <tr key={item.id} className={nested ? styles.nestedRow : undefined}>
      <td className={nested ? styles.indentCell : undefined}>{rowNumber}</td>
      <td>{item.pattern}</td>
      <td>
        <span className={styles[`mode_${item.mode}`]}>
          {t(item.mode === "no_tariff" ? "whitelistModeNoTariff" : "whitelistModeHidden")}
        </span>
      </td>
      {showFolderColumn && (
        <td>
          {item.folder ? (
            <span className={styles.folderTag}>
              <Folder size={13} color={FOLDER_ICON_COLOR} fill={FOLDER_ICON_COLOR} />
              {item.folder.name}
            </span>
          ) : (
            "—"
          )}
        </td>
      )}
      <td>
        {item.location_ids?.length
          ? item.location_ids.map((lid) => locations.find((l) => l.id === lid)?.name || lid).join(", ")
          : t("allLocations")}
      </td>
      <td>{item.description || "—"}</td>
      <td>
        <Badge text={item.status ? "true" : "false"} />
      </td>
      <ActionCell
        item={item}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />
    </tr>
  );

  const renderBody = () => {
    if (!data?.length) {
      return (
        <tbody>
          <tr>
            <td colSpan={colCount}>{t("noData")}</td>
          </tr>
        </tbody>
      );
    }

    if (!groupByFolder) {
      return (
        <tbody>
          {getSortedData().map((item, i) => renderRow(item, (currentPage - 1) * pageSize + i + 1))}
        </tbody>
      );
    }

    const groups = getGroups();
    let counter = (currentPage - 1) * pageSize;

    return (
      <tbody>
        {groups.map((group) => {
          const collapsed = !expandedGroups.includes(group.key);
          const rows = collapsed ? [] : group.items.map((item) => renderRow(item, ++counter, true));
          if (collapsed) counter += group.items.length;

          return (
            <Fragment key={group.key}>
              <tr className={styles.folderRow} onClick={() => toggleGroup(group.key)}>
                <td colSpan={colCount}>
                  <span className={styles.folderRowInner}>
                    <span className={styles.chevron}>
                      {group.items.length > 0 &&
                        (collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />)}
                    </span>
                    {collapsed || !group.items.length ? (
                      <Folder
                        size={15}
                        color={group.isRoot ? "var(--placeholder-color)" : FOLDER_ICON_COLOR}
                        fill={group.isRoot ? "none" : FOLDER_ICON_COLOR}
                      />
                    ) : (
                      <FolderOpen
                        size={15}
                        color={group.isRoot ? "var(--placeholder-color)" : FOLDER_ICON_COLOR}
                      />
                    )}
                    <span className={styles.folderRowName}>{group.name}</span>
                    <span className={styles.folderRowCount}>({group.items.length})</span>
                  </span>
                </td>
              </tr>
              {rows}
              {!collapsed && !group.items.length && (
                <tr className={styles.emptyFolderRow}>
                  <td colSpan={colCount}>
                    <span className={styles.emptyFolderText}>{t("folderEmpty")}</span>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    );
  };

  return (
    <div className={styles.whitelistPage}>
      {loading ? (
        <Loading />
      ) : (
        <div className={`${styles.main} settings-page`}>
          <PageHero icon={ShieldCheck} title={t("vehicle-whitelist")} />
          <div className={styles.statsGrid}>
              <StatWidget
                icon={List}
                color="#6366f1"
                label={t("vehicle-whitelist")}
                value={totalItems}
              />
              <StatWidget
                icon={ShieldCheck}
                color="#10b981"
                label={t("whitelistModeNoTariff")}
                value={noTariffCount}
                sub={`/ ${data.length}`}
                progress={data.length > 0 ? (noTariffCount / data.length) * 100 : 0}
              />
              <StatWidget
                icon={ShieldOff}
                color="#ef4444"
                label={t("whitelistModeHidden")}
                value={hiddenCount}
                sub={`/ ${data.length}`}
              />
            </div>

          <WhitelistFolderBar
            folders={folders}
            activeFolder={formData.folder_id}
            onSelect={handleSelectFolder}
            onFoldersChange={refreshAll}
            totalCount={folderStats.total}
            uncategorizedCount={folderStats.uncategorized}
            canAdd={canAdd}
            canEdit={canEdit}
            canDelete={canDelete}
          />

          <div className={styles.mainHeader}>
            <div className={styles.filterWrapper}>
              <Search formData={formData} setFormData={setFormData} onSearch={handleSearch} />

              <div className={styles.statusFilter}>
                {[
                  { value: "", label: t("all") },
                  { value: "true", label: t("enabled") },
                  { value: "false", label: t("disabled") },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.statusBtn} ${formData.status === value ? (value === "false" ? styles.statusBtnActiveDanger : value === "true" ? styles.statusBtnActiveSuccess : styles.statusBtnActive) : ""}`}
                    onClick={() => {
                      const updated = { ...formData, status: value };
                      setFormData(updated);
                      handleSearch(updated);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {!groupByFolder && (
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                totalPages={totalPages}
                handleChangePageSize={handleChangePageSize}
                handlePageChange={handlePageChange}
              />
            )}

            <div className={styles.buttonsWrapper}>
              <button
                type="button"
                className={`${styles.refreshBtn} ${groupByFolder ? styles.refreshBtnActive : ""}`}
                title={t("groupByFolder")}
                onClick={() => {
                  setGroupByFolder((prev) => !prev);
                  setCurrentPage(1);
                }}
              >
                <FolderTree size={16} />
                <span>{t("groupByFolder")}</span>
              </button>
              {canAdd && (
                <>
                  <Button text={t("add")} onClick={() => setModalType("add")} />
                  <Button
                    text={importing ? t("importing") : t("importExcel")}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                  />
                  <button
                    className={styles.refreshBtn}
                    title={t("downloadTemplate")}
                    onClick={handleDownloadTemplate}
                  >
                    <FileDown size={16} />
                    <span>{t("downloadTemplate")}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={handleImportExcel}
                  />
                </>
              )}
              <div className={styles.refreshBtn} onClick={refreshAll}>
                {Icons.refresh}
              </div>
              {data.length > 0 && <DownloadButton text={t("save")} />}
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th onClick={() => handleSort("pattern")}>
                    <span className={styles.headerContent}>
                      {t("whitelistPattern")}
                      <SortArrow active={sortField === "pattern"} order={sortOrder} />
                    </span>
                  </th>
                  <th onClick={() => handleSort("mode")}>
                    <span className={styles.headerContent}>
                      {t("whitelistMode")}
                      <SortArrow active={sortField === "mode"} order={sortOrder} />
                    </span>
                  </th>
                  {showFolderColumn && <th>{t("folder")}</th>}
                  <th>{t("locations")}</th>
                  <th>{t("description")}</th>
                  <th onClick={() => handleSort("status")}>
                    <span className={styles.headerContent}>
                      {t("status")}
                      <SortArrow active={sortField === "status"} order={sortOrder} />
                    </span>
                  </th>
                  {(canEdit || canDelete) && <th>{t("action")}</th>}
                </tr>
              </thead>
              {renderBody()}
            </table>
          </div>
        </div>
      )}

      <CenterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAccept={() => handleDelete(selectedItem)}
        title={t("areYouSureDelete")}
      />

      <OverlaySidebar
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalType === "add" ? t("addWhitelistEntry") : t("editWhitelistEntry")}
        width="500px"
      >
        {modalType !== null && (
          <AddVehicleWhitelist
            id={modalType === "edit" ? selectedItem : null}
            folders={folders}
            defaultFolderId={activeFolder?.id ?? null}
            onFoldersChange={fetchFolders}
            handleClose={() => setModalType(null)}
            onSuccess={() => {
              setTimeout(() => setModalType(null), 500);
              refreshAll();
            }}
          />
        )}
      </OverlaySidebar>
    </div>
  );
};

export default VehicleWhitelistPage;
