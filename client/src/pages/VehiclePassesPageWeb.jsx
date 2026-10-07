import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Car,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  AlignJustify,
  Grid2X2,
} from "lucide-react";

import { getVehiclePasses, exportVehiclePasses, deleteVehiclePass } from "../api/vehiclePasses";
import { getActiveLocations } from "../api";
import { usePermissions } from "../hooks/usePermissions";
import { useAlertStore } from "../stores/alertStore";

import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import DownloadButton from "../components/DownloadButton";
import VehiclePassesTable from "../components/VehiclePassesTable";
import MultiSelectDoors from "../components/MultiSelectDoors";
import Search from "../components/Search";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import OverlaySidebar from "../components/OverlaySidebar";
import AddVehiclePass from "../components/AddVehiclePass";
import AddVehiclePassBulk from "../components/AddVehiclePassBulk";
import styles from "./VehiclePassesPageWeb.module.scss";

const PRESETS = [
  { key: "today", labelKey: "financeToday" },
  { key: "yesterday", labelKey: "financeYesterday" },
  { key: "week", labelKey: "financeLast7" },
  { key: "month", labelKey: "financeThisMonth" },
  { key: "lastMonth", labelKey: "financeLastMonth" },
];

const getPresetDates = (key) => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (key === "today") {
    const s = fmt(now);
    return { start_date: `${s} 00:00`, end_date: `${s} 23:59` };
  }
  if (key === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    const s = fmt(d);
    return { start_date: `${s} 00:00`, end_date: `${s} 23:59` };
  }
  if (key === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const d = new Date(now);
    d.setDate(d.getDate() - diff);
    return { start_date: `${fmt(d)} 00:00`, end_date: `${fmt(now)} 23:59` };
  }
  if (key === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start_date: `${fmt(d)} 00:00`, end_date: `${fmt(now)} 23:59` };
  }
  if (key === "lastMonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start_date: `${fmt(first)} 00:00`,
      end_date: `${fmt(last)} 23:59`,
    };
  }
  return {};
};

const StatWidget = ({ icon: Icon, color, label, value, sub, progress }) => (
  <div className={styles.statWidget}>
    <div className={styles.statWidgetInner}>
      <div
        className={styles.statWidgetIcon}
        style={{ background: color + "18" }}
      >
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
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: color,
          }}
        />
      </div>
    )}
  </div>
);

const VehiclePassesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalExits, setTotalExits] = useState(0);
  const [viewType, setViewType] = useState("card");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [activePreset, setActivePreset] = useState("today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const { t } = useTranslation();
  const currentPath = window.location.pathname;
  const { canAdd, canDelete, canEdit } = usePermissions(currentPath);
  const { showAlert } = useAlertStore();

  const today = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    start_date: `${today} 00:00`,
    end_date: `${today} 23:59`,
    branch_id: null,
    direction: "",
    selectedLocationIds: [],
  });

  useEffect(() => {
    getActiveLocations()
      .then(({ data }) => setParkings(data))
      .catch(console.error);
  }, []);

  const fetchData = async (
    page = currentPage,
    filters = formData,
    size = pageSize,
  ) => {
    setLoading(true);
    try {
      const { data, pagination } = await getVehiclePasses({
        page,
        pageSize: size,
        filters,
      });
      setData(data);
      setTotalPages(pagination?.totalPages);
      setCurrentPage(pagination?.currentPage ?? currentPage);
      setTotalItems(pagination?.totalItems ?? 0);
      setTotalEntries(pagination?.totalEntries ?? 0);
      setTotalExits(pagination?.totalExits ?? 0);
    } catch (err) {
      console.error("Ошибка загрузки данных посещаемости:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, pageSize]);

  const handlePreset = (key) => {
    const dates = getPresetDates(key);
    const newFormData = { ...formData, ...dates };
    setFormData(newFormData);
    setActivePreset(key);
    setCurrentPage(1);
    fetchData(1, newFormData, pageSize);
  };

  const handleApply = () => {
    setActivePreset(null);
    setCurrentPage(1);
    fetchData(1, formData, pageSize);
  };

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    },
    [totalPages],
  );

  const handleChangePageSize = useCallback((e) => {
    const size = parseInt(e.target.value, 10);
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSearch = (d = formData) => {
    setCurrentPage(1);
    fetchData(1, d, pageSize);
  };

  const handleViewChange = (type) => {
    setViewType(type);
    setDropdownOpen(false);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const blob = await exportVehiclePasses(formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle-passes.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Ошибка экспорта:", err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleEdit = (id) => {
    setEditId(id);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await deleteVehiclePass(id);
      setData((prev) => prev.filter((item) => item.id !== id));
      setTotalItems((prev) => prev - 1);
      showAlert(t("success"), "success");
    } catch (err) {
      console.error("Ошибка удаления:", err);
      showAlert(t("error"), "error");
    }
  };

  return (
    <div className={styles.vehiclePassesPages}>
      <div className={styles.main}>
        <PageHeader icon={Car} title={t("vehicle-passes")} subtitle={t("pageSubtitleVehiclePasses")} color="#6366f1" />
        {/* Stats — always visible */}
        <div className={styles.statsGrid}>
          <StatWidget
            icon={Car}
            color="#6366f1"
            label={t("totalPassesLabel")}
            value={totalItems}
          />
          <StatWidget
            icon={ArrowDownToLine}
            color="#10b981"
            label={t("entry")}
            value={totalEntries}
          />
          <StatWidget
            icon={ArrowUpFromLine}
            color="#f59e0b"
            label={t("exit")}
            value={totalExits}
          />
        </div>

        {/* Controls bar */}
        <div className={styles.controls}>
          <div className={styles.leftControls}>
            <Search
              formData={formData}
              setFormData={setFormData}
              onSearch={handleSearch}
            />
            <div className={styles.locationGroup}>
              <MultiSelectDoors
                options={parkings}
                selected={formData.selectedLocationIds || []}
                placeholder={t("selectLocations")}
                onChange={(ids) => {
                  const next = { ...formData, selectedLocationIds: ids };
                  setFormData(next);
                  setCurrentPage(1);
                  fetchData(1, next, pageSize);
                }}
              />
            </div>

            <div className={styles.dirSelectWrap}>
              <select
                className={styles.dirSelect}
                value={formData.direction}
                onChange={(e) => {
                  const next = { ...formData, direction: e.target.value };
                  setFormData(next);
                  setCurrentPage(1);
                  fetchData(1, next, pageSize);
                }}
              >
                <option value="">{t("all")}</option>
                <option value="entry">{t("entry")}</option>
                <option value="exit">{t("exit")}</option>
              </select>
            </div>
          </div>

          <div className={styles.rightControls}>
            <div className={styles.filterGroup}>
              <div className={styles.presetSelectWrap}>
                <select
                  className={styles.presetSelect}
                  value={activePreset ?? ""}
                  onChange={(e) => {
                    if (e.target.value) handlePreset(e.target.value);
                  }}
                  title={t("period")}
                >
                  {!activePreset && (
                    <option value="">{t("financeCustom")}</option>
                  )}
                  {PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {t(p.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className={styles.dateInput}
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }));
                  setActivePreset(null);
                }}
                onFocus={(e) => e.target.showPicker?.()}
              />
              <input
                className={styles.dateInput}
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }));
                  setActivePreset(null);
                }}
                onFocus={(e) => e.target.showPicker?.()}
              />
              <button className={styles.applyBtn} onClick={handleApply}>
                {t("apply")}
              </button>
            </div>

            {canAdd && (
              <>
                <Button
                  text={t("add")}
                  onClick={() => {
                    setEditId(null);
                    setShowAddModal(true);
                  }}
                />
                <Button
                  text={t("bulkAdd")}
                  onClick={() => setShowBulkModal(true)}
                />
              </>
            )}

            <button
              className={styles.refreshBtn}
              onClick={() => fetchData()}
              title={t("refresh")}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Table sub-header: [spacer] [pagination center] [view toggle + download right] */}
        <div className={styles.tableSubHeader}>
          <div className={styles.tableSubHeaderSpacer} />

          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            handleChangePageSize={handleChangePageSize}
            handlePageChange={handlePageChange}
          />

          <div className={styles.tableSubHeaderRight}>
            {data.length > 0 && (
              <>
                <div className={styles.customDropdown}>
                  <button onClick={() => setDropdownOpen((prev) => !prev)}>
                    {viewType === "row" ? (
                      <AlignJustify size={15} strokeWidth={1.75} />
                    ) : (
                      <Grid2X2 size={15} strokeWidth={1.75} />
                    )}
                    {viewType === "row" ? t("listView") : t("cardView")}
                  </button>
                  {isDropdownOpen && (
                    <ul>
                      <li onClick={() => handleViewChange("row")}>
                        <AlignJustify size={15} strokeWidth={1.75} />{" "}
                        {t("listView")}
                      </li>
                      <li onClick={() => handleViewChange("card")}>
                        <Grid2X2 size={15} strokeWidth={1.75} /> {t("cardView")}
                      </li>
                    </ul>
                  )}
                </div>

                <DownloadButton
                  text={t("save")}
                  onClick={handleExport}
                  loading={exportLoading}
                />
              </>
            )}
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <VehiclePassesTable
            data={data}
            currentPage={currentPage}
            pageSize={pageSize}
            viewType={viewType}
            canDelete={canDelete}
            onDelete={handleDelete}
            canEdit={canEdit}
            onEdit={handleEdit}
          />
        )}
      </div>

      <OverlaySidebar
        isOpen={showAddModal}
        onClose={handleCloseModal}
        width="500px"
      >
        {showAddModal && (
          <AddVehiclePass
            id={editId}
            handleClose={handleCloseModal}
            onSuccess={() =>
              editId
                ? fetchData(currentPage, formData, pageSize)
                : fetchData(1, formData, pageSize)
            }
          />
        )}
      </OverlaySidebar>

      <OverlaySidebar
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        width="500px"
      >
        {showBulkModal && (
          <AddVehiclePassBulk
            handleClose={() => setShowBulkModal(false)}
            onSuccess={() => fetchData(1, formData, pageSize)}
          />
        )}
      </OverlaySidebar>
    </div>
  );
};

export default VehiclePassesPage;
