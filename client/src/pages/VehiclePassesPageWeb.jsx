import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Car,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Download,
} from "lucide-react";

import { getVehiclePasses, exportVehiclePasses, deleteVehiclePass } from "../api/vehiclePasses";
import { getActiveLocations } from "../api";
import { usePermissions } from "../hooks/usePermissions";
import { useAlertStore } from "../stores/alertStore";

import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import PageHero from "../components/PageHero";
import VehiclePassesTable from "../components/VehiclePassesTable";
import MultiSelectDoors from "../components/MultiSelectDoors";
import Dropdown from "../components/Dropdown";
import Search from "../components/Search";
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

const HeroStat = ({ icon: Icon, tone, label, value }) => (
  <div className={`${styles.heroStat} ${styles[tone]}`}>
    <span className={styles.heroStatIcon}>
      <Icon size={16} strokeWidth={2.2} />
    </span>
    <span className={styles.heroStatBody}>
      <span className={styles.heroStatValue}>
        {new Intl.NumberFormat("ru-RU").format(value ?? 0)}
      </span>
      <span className={styles.heroStatLabel}>{label}</span>
    </span>
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
  const [exportLoading, setExportLoading] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [activePreset, setActivePreset] = useState("today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState("single");
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

  // Новые фильтры → первая страница. Если страница уже 1, эффект не сработает — грузим сами,
  // иначе загрузку делает эффект по смене currentPage (без двойного запроса)
  const applyFilters = (next) => {
    setFormData(next);
    if (currentPage === 1) fetchData(1, next, pageSize);
    else setCurrentPage(1);
  };

  const handlePreset = (key) => {
    setActivePreset(key);
    applyFilters({ ...formData, ...getPresetDates(key) });
  };

  const handleApply = () => {
    setActivePreset(null);
    applyFilters(formData);
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

  const handleSearch = (d = formData) => applyFilters(d);

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
        <PageHero
          icon={Car}
          title={t("vehicle-passes")}
          subtitle={t("pageSubtitleVehiclePasses")}
        >
          <div className={styles.heroStats}>
            <HeroStat
              icon={Car}
              tone="toneAll"
              label={t("totalPassesLabel")}
              value={totalItems}
            />
            <HeroStat
              icon={ArrowDownToLine}
              tone="toneIn"
              label={t("entry")}
              value={totalEntries}
            />
            <HeroStat
              icon={ArrowUpFromLine}
              tone="toneOut"
              label={t("exit")}
              value={totalExits}
            />
          </div>
          {data.length > 0 && (
            <button
              type="button"
              className={`${styles.heroDownload} ${exportLoading ? styles.heroDownloadBusy : ""}`}
              onClick={handleExport}
              disabled={exportLoading}
              title={t("save")}
            >
              {exportLoading ? (
                <RefreshCw size={17} strokeWidth={2.2} />
              ) : (
                <Download size={17} strokeWidth={2.2} />
              )}
            </button>
          )}
        </PageHero>
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
                onChange={(ids) =>
                  applyFilters({ ...formData, selectedLocationIds: ids })
                }
              />
            </div>

            <Dropdown
              minWidth={120}
              value={formData.direction}
              options={[
                { value: "", label: t("all") },
                { value: "entry", label: t("entry") },
                { value: "exit", label: t("exit") },
              ]}
              onChange={(direction) => applyFilters({ ...formData, direction })}
            />
          </div>

          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            handleChangePageSize={handleChangePageSize}
            handlePageChange={handlePageChange}
          />

          <div className={styles.rightControls}>
            <div className={styles.filterGroup}>
              <Dropdown
                minWidth={130}
                title={t("period")}
                value={activePreset ?? ""}
                options={[
                  ...(activePreset
                    ? []
                    : [{ value: "", label: t("financeCustom") }]),
                  ...PRESETS.map((p) => ({
                    value: p.key,
                    label: t(p.labelKey),
                  })),
                ]}
                onChange={(key) => {
                  if (key) handlePreset(key);
                }}
              />
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
              <Button
                text={t("add")}
                onClick={() => {
                  setEditId(null);
                  setAddMode("single");
                  setShowAddModal(true);
                }}
              />
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

        {loading && data.length === 0 ? (
          <Loading />
        ) : (
          <div
            className={`${styles.tableArea} ${loading ? styles.reloading : ""}`}
          >
          <VehiclePassesTable
            data={data}
            currentPage={currentPage}
            pageSize={pageSize}
            viewType="card"
            canDelete={canDelete}
            onDelete={handleDelete}
            canEdit={canEdit}
            onEdit={handleEdit}
          />
          </div>
        )}
      </div>

      <OverlaySidebar
        isOpen={showAddModal}
        onClose={handleCloseModal}
        width="500px"
      >
        {showAddModal && (
          <>
            {!editId && (
              <div className={styles.addModeTabs}>
                <button
                  type="button"
                  className={addMode === "single" ? styles.addModeActive : ""}
                  onClick={() => setAddMode("single")}
                >
                  {t("addSingle")}
                </button>
                <button
                  type="button"
                  className={addMode === "bulk" ? styles.addModeActive : ""}
                  onClick={() => setAddMode("bulk")}
                >
                  {t("bulkAdd")}
                </button>
              </div>
            )}
            {!editId && addMode === "bulk" ? (
              <AddVehiclePassBulk
                handleClose={handleCloseModal}
                onSuccess={() => fetchData(1, formData, pageSize)}
              />
            ) : (
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
          </>
        )}
      </OverlaySidebar>
    </div>
  );
};

export default VehiclePassesPage;
