import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Car,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Download,
  Filter,
  Plus,
  Search as SearchIcon,
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

const fmtNum = (n) => new Intl.NumberFormat("ru-RU").format(n ?? 0);

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
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const filterBtnRef = useRef(null);
  const searchTimer = useRef(null);
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
    setFilterOpen(false);
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

  const onSearchChange = (e) => {
    const next = { ...formData, search: e.target.value };
    setFormData(next);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilters(next), 1000);
  };

  const onSearchKey = (e) => {
    if (e.key !== "Enter") return;
    clearTimeout(searchTimer.current);
    applyFilters(formData);
  };

  const resetFilters = () => {
    const next = {
      ...formData,
      ...getPresetDates("today"),
      direction: "",
      selectedLocationIds: [],
    };
    setActivePreset("today");
    setFilterOpen(false);
    applyFilters(next);
  };

  // Окно фильтров: закрытие по клику вне и Escape
  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e) => {
      const el = e.target;
      if (filterRef.current?.contains(el) || filterBtnRef.current?.contains(el)) return;
      setFilterOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setFilterOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  const activeFilters = [
    (formData.selectedLocationIds || []).length > 0,
    !!formData.direction,
    activePreset !== "today",
  ].filter(Boolean).length;

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
        <div className={styles.heroWrap}>
        <PageHero
          icon={Car}
          title={t("vehicle-passes")}
          subtitle={t("pageSubtitleVehiclePasses")}
          center={
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              handleChangePageSize={handleChangePageSize}
              handlePageChange={handlePageChange}
            />
          }
        >
          <div className={styles.heroSearch}>
            <SearchIcon size={15} />
            <input
              type="text"
              placeholder={t("search")}
              value={formData.search || ""}
              onChange={onSearchChange}
              onKeyDown={onSearchKey}
            />
          </div>
          <button
            type="button"
            ref={filterBtnRef}
            className={`${styles.heroBtn} ${filterOpen ? styles.heroBtnOn : ""}`}
            onClick={() => setFilterOpen((v) => !v)}
          >
            <Filter size={15} />
            <span>{t("filters")}</span>
            {activeFilters > 0 && <span className={styles.filterCount}>{activeFilters}</span>}
          </button>
          {canAdd && (
            <button
              type="button"
              className={styles.heroBtn}
              onClick={() => {
                setEditId(null);
                setAddMode("single");
                setShowAddModal(true);
              }}
            >
              <Plus size={15} />
              <span>{t("add")}</span>
            </button>
          )}
          <button
            type="button"
            className={styles.heroIconBtn}
            onClick={() => fetchData()}
            title={t("refresh")}
            aria-label={t("refresh")}
          >
            <RefreshCw size={16} />
          </button>
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

        {filterOpen && (
          <div className={styles.filterPopover} ref={filterRef}>
            <div className={styles.filterGrid}>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>{t("period")}</span>
                <Dropdown
                  className={styles.modalDropdown}
                  minWidth={130}
                  value={activePreset ?? ""}
                  options={[
                    ...(activePreset ? [] : [{ value: "", label: t("financeCustom") }]),
                    ...PRESETS.map((p) => ({ value: p.key, label: t(p.labelKey) })),
                  ]}
                  onChange={(key) => {
                    if (!key) return;
                    setActivePreset(key);
                    setFormData((prev) => ({ ...prev, ...getPresetDates(key) }));
                  }}
                />
              </div>
              <div className={styles.field}>
                <span>{t("dateFrom")}</span>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, start_date: e.target.value }));
                    setActivePreset(null);
                  }}
                />
              </div>
              <div className={styles.field}>
                <span>{t("dateTo")}</span>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, end_date: e.target.value }));
                    setActivePreset(null);
                  }}
                />
              </div>
              <div className={`${styles.field} ${styles.fieldWide} ${styles.locationGroup}`}>
                <span>{t("locations")}</span>
                <MultiSelectDoors
                  options={parkings}
                  selected={formData.selectedLocationIds || []}
                  placeholder={t("selectLocations")}
                  onChange={(ids) => setFormData((prev) => ({ ...prev, selectedLocationIds: ids }))}
                />
              </div>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>{t("direction")}</span>
                <Dropdown
                  className={styles.modalDropdown}
                  minWidth={120}
                  value={formData.direction}
                  options={[
                    { value: "", label: t("all") },
                    { value: "entry", label: t("entry") },
                    { value: "exit", label: t("exit") },
                  ]}
                  onChange={(direction) => setFormData((prev) => ({ ...prev, direction }))}
                />
              </div>
            </div>
            <div className={styles.filterFoot}>
              <button type="button" className={styles.filterReset} onClick={resetFilters}>
                {t("resetAllFilters")}
              </button>
              <button type="button" className={styles.filterApply} onClick={handleApply}>
                {t("apply")}
              </button>
            </div>
          </div>
        )}
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

        <div className={styles.statsLine}>
          <span>
            {t("totalPassesLabel")} <b>{fmtNum(totalItems)}</b>
          </span>
          <i />
          <span className={styles.statIn}>
            <ArrowDownToLine size={13} strokeWidth={2.4} />
            {t("entry")} <b>{fmtNum(totalEntries)}</b>
          </span>
          <i />
          <span className={styles.statOut}>
            <ArrowUpFromLine size={13} strokeWidth={2.4} />
            {t("exit")} <b>{fmtNum(totalExits)}</b>
          </span>
        </div>
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
