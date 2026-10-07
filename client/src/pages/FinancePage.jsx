import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Car,
  ParkingCircle,
  BarChart2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Trash2,
  Check,
  Undo2,
} from "lucide-react";

import {
  getFinanceSummary,
  getFinanceLocationParkings,
  closeFinanceParking,
  cancelFinanceParking,
} from "../api";
import { deleteVehiclePass, updateVehiclePass } from "../api/vehiclePasses";
import { usePermissions } from "../hooks/usePermissions";
import { exportFinanceExcel } from "../utils/exportFinanceExcel";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import styles from "./FinancePage.module.scss";

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

const KpiCard = ({ icon: Icon, color, label, value, sub }) => (
  <div className={styles.kpiCard}>
    <div className={styles.kpiIcon} style={{ background: color + "18" }}>
      <Icon size={18} color={color} strokeWidth={2} />
    </div>
    <div className={styles.kpiBody}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue} style={{ color }}>
        {value}
        {sub && <span className={styles.kpiSub}> {sub}</span>}
      </span>
    </div>
  </div>
);

export const PRESETS = [
  { key: "today", label: "financeToday" },
  { key: "yesterday", label: "financeYesterday" },
  { key: "week", label: "financeLast7" },
  { key: "month", label: "financeThisMonth" },
  { key: "lastMonth", label: "financeLastMonth" },
];

export function getPresetRange(key) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (key === "today") {
    const s = fmt(now);
    return { from: s, to: s };
  }
  if (key === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    const s = fmt(d);
    return { from: s, to: s };
  }
  if (key === "week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const d = new Date(now);
    d.setDate(d.getDate() - diffToMonday);
    return { from: fmt(d), to: fmt(now) };
  }
  if (key === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(d), to: fmt(now) };
  }
  if (key === "lastMonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(first), to: fmt(last) };
  }
  return { from: fmt(now), to: fmt(now) };
}

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTitle}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span style={{ color: p.color }}>{p.name}:</span>
          <span>
            {fmt(p.value)} {p.dataKey === "revenue" ? currency : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

const fmtPlate = (plate) => {
  if (!plate) return "—";
  const s = plate.toUpperCase().replace(/\s+/g, "");
  // Private: 2digits + 1letter + 3digits + 2letters  →  01 A 123 BC
  const priv = s.match(/^(\d{2})([A-Z])(\d{3})([A-Z]{2})$/);
  if (priv) return `${priv[1]} ${priv[2]} ${priv[3]} ${priv[4]}`;
  // Corporate: 2digits + 3digits + 3letters  →  01 123 ABC
  const corp = s.match(/^(\d{2})(\d{3})([A-Z]{3})$/);
  if (corp) return `${corp[1]} ${corp[2]} ${corp[3]}`;
  return plate;
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtDuration = (minutes) => {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
};

const toLocalIso = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const SessionsModal = ({ parking, range, currency, onClose, canDelete, canEdit, closedOnly = false }) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [totalClosed, setTotalClosed] = useState(0);
  const [totalOpen, setTotalOpen] = useState(0);
  const [totalRevenueClosed, setTotalRevenueClosed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState(closedOnly ? "closed" : "all");
  const [page, setPage] = useState(1);
  const [closingEntryId, setClosingEntryId] = useState(null);
  const [closeDateTime, setCloseDateTime] = useState("");
  const [search, setSearch] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [confirmSession, setConfirmSession] = useState(null);
  const [pageSize, setPageSize] = useState(50);
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [showSort, setShowSort] = useState(false);
  const [editingPlate, setEditingPlate] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkAction, setBulkAction] = useState(null); // "delete" | "close" | "cancel"
  const [bulkCloseDateTime, setBulkCloseDateTime] = useState("");

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (lightboxSrc) {
          setLightboxSrc(null);
        } else if (confirmSession) {
          setConfirmSession(null);
        } else if (bulkAction) {
          setBulkAction(null);
        } else {
          onClose();
        }
      }
      if (e.key === "Enter" && confirmSession && !actionLoading) {
        handleDeleteSession(confirmSession);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxSrc, onClose, confirmSession, bulkAction, actionLoading]);

  const fetchSessions = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await getFinanceLocationParkings({
        locationId: parking.id,
        from: range.from,
        to: range.to,
      });
      setSessions(res.records);
      setTotalClosed(res.totalClosed);
      setTotalOpen(res.totalOpen);
      setTotalRevenueClosed(res.totalRevenueClosed ?? res.totalClosed);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [parking.id, range.from, range.to]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCloseSession = async (plateNumber, dateStr) => {
    setActionLoading(`close-${plateNumber}`);
    try {
      await closeFinanceParking({
        locationId: parking.id,
        plateNumber,
        date: new Date(dateStr).toISOString(),
      });
      setClosingEntryId(null);
      await fetchSessions({ silent: true });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSession = async (exitId) => {
    setActionLoading(`cancel-${exitId}`);
    try {
      await cancelFinanceParking({ exitId });
      await fetchSessions({ silent: true });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSession = async (session) => {
    const key = `delete-${session.entry_id ?? session.exit_id}`;
    setActionLoading(key);
    try {
      if (session.exit_id) await deleteVehiclePass(session.exit_id);
      if (session.entry_id) await deleteVehiclePass(session.entry_id);
      setConfirmSession(null);
      await fetchSessions({ silent: true });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const startClose = (entryId) => {
    setClosingEntryId(entryId);
    setCloseDateTime(toLocalIso(new Date()));
  };

  const searchNorm = search.toUpperCase().replace(/\s+/g, "");
  const filtered = sessions.filter((s) => {
    if (closedOnly && s.is_open) return false;
    const filterOk =
      filter === "closed" ? !s.is_open : filter === "open" ? s.is_open : true;
    const searchOk =
      !searchNorm ||
      (s.plate_number ?? "")
        .toUpperCase()
        .replace(/\s+/g, "")
        .includes(searchNorm);
    return filterOk && searchOk;
  });

  const displayed = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "plate") {
      return dir * (a.plate_number ?? "").localeCompare(b.plate_number ?? "");
    }
    if (sortKey === "duration") {
      return dir * ((a.duration_minutes ?? 0) - (b.duration_minutes ?? 0));
    }
    if (sortKey === "status") {
      return dir * ((a.is_open ? 1 : 0) - (b.is_open ? 1 : 0));
    }
    if (sortKey === "price") {
      const pa = a.is_no_tariff || a.is_free_period ? 0 : 1;
      const pb = b.is_no_tariff || b.is_free_period ? 0 : 1;
      return dir * (pa - pb);
    }
    return dir * (new Date(a.entry_time || 0) - new Date(b.entry_time || 0));
  });

  const totalPages = Math.ceil(displayed.length / pageSize);
  const effectivePage = totalPages > 0 && page > totalPages ? totalPages : page;
  const pageRows = displayed.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // Множественный выбор: ключ строки — пара id въезда/выезда
  const rowKey = (s) => `${s.entry_id ?? ""}|${s.exit_id ?? ""}`;
  const selectedSessions = displayed.filter((s) => selected.has(rowKey(s)));
  const selectedOpen = selectedSessions.filter((s) => s.is_open && s.entry_id);
  const selectedCancelable = selectedSessions.filter(
    (s) => !s.is_open && s.is_manual && s.exit_id,
  );
  const pageAllSelected =
    pageRows.length > 0 && pageRows.every((s) => selected.has(rowKey(s)));

  const clearSelection = () => setSelected(new Set());

  const toggleRow = (s) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const key = rowKey(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((s) =>
        pageAllSelected ? next.delete(rowKey(s)) : next.add(rowKey(s)),
      );
      return next;
    });

  const handleFilter = (f) => {
    setFilter(f);
    setPage(1);
    setClosingEntryId(null);
    clearSelection();
  };
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const handleSearch = (v) => {
    setSearch(v);
    setPage(1);
    setClosingEntryId(null);
    clearSelection();
  };

  const handleSavePlate = async () => {
    if (!editingPlate) return;
    setActionLoading("edit-plate");
    try {
      const { entryId, exitId, value } = editingPlate;
      if (entryId) await updateVehiclePass(entryId, { plate_number: value });
      if (exitId) await updateVehiclePass(exitId, { plate_number: value });
      setEditingPlate(null);
      await fetchSessions({ silent: true });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const startBulk = (action) => {
    if (action === "close") setBulkCloseDateTime(toLocalIso(new Date()));
    setBulkAction(action);
  };

  const finishBulk = async () => {
    setBulkAction(null);
    clearSelection();
    await fetchSessions({ silent: true });
  };

  const handleBulkDelete = async () => {
    setActionLoading("bulk");
    try {
      for (const s of selectedSessions) {
        if (s.exit_id) await deleteVehiclePass(s.exit_id);
        if (s.entry_id) await deleteVehiclePass(s.entry_id);
      }
      await finishBulk();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkClose = async () => {
    if (!bulkCloseDateTime) return;
    setActionLoading("bulk");
    try {
      const date = new Date(bulkCloseDateTime).toISOString();
      for (const s of selectedOpen) {
        await closeFinanceParking({
          locationId: parking.id,
          plateNumber: s.plate_number,
          date,
        });
      }
      await finishBulk();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkCancel = async () => {
    setActionLoading("bulk");
    try {
      for (const s of selectedCancelable) {
        await cancelFinanceParking({ exitId: s.exit_id });
      }
      await finishBulk();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const revenue = totalRevenueClosed * (parking.tariff?.base_price ?? 0);

  return (
    <>
      {lightboxSrc && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className={styles.lightboxClose}
            onClick={() => setLightboxSrc(null)}
          >
            <X size={20} />
          </button>
          <img
            className={styles.lightboxImg}
            src={lightboxSrc}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {confirmSession && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmSession(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <X size={22} />
            </div>
            <div className={styles.confirmTitle}>{t("confirmDelete")}</div>
            <div className={styles.confirmPlate}>
              {fmtPlate(confirmSession.plate_number)}
            </div>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setConfirmSession(null)}
              >
                {t("cancel")}
              </button>
              <button
                className={styles.confirmDeleteBtn}
                disabled={!!actionLoading}
                onClick={() => handleDeleteSession(confirmSession)}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
      {bulkAction && (
        <div className={styles.confirmOverlay} onClick={() => setBulkAction(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div
              className={`${styles.confirmIcon} ${
                bulkAction === "close"
                  ? styles.confirmIconWarn
                  : bulkAction === "cancel"
                    ? styles.confirmIconInfo
                    : ""
              }`}
            >
              {bulkAction === "delete" ? (
                <Trash2 size={22} />
              ) : bulkAction === "close" ? (
                <Check size={22} />
              ) : (
                <Undo2 size={22} />
              )}
            </div>
            <div className={styles.confirmTitle}>
              {bulkAction === "delete"
                ? t("confirmDeleteSelected")
                : bulkAction === "close"
                  ? t("confirmCloseSelected")
                  : t("confirmCancelSelected")}
            </div>
            <div className={styles.confirmSub}>
              {t("selectedCount")}:{" "}
              {bulkAction === "delete"
                ? selectedSessions.length
                : bulkAction === "close"
                  ? selectedOpen.length
                  : selectedCancelable.length}{" "}
              {t("bulkRecords")}
            </div>
            {bulkAction === "close" && (
              <div className={styles.confirmDtRow}>
                <span className={styles.confirmDtLabel}>{t("exit")}</span>
                <input
                  type="datetime-local"
                  className={styles.confirmDtInput}
                  value={bulkCloseDateTime}
                  onChange={(e) => setBulkCloseDateTime(e.target.value)}
                />
              </div>
            )}
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setBulkAction(null)}
              >
                {t("cancel")}
              </button>
              {bulkAction === "delete" ? (
                <button
                  className={styles.confirmDeleteBtn}
                  disabled={!!actionLoading || selectedSessions.length === 0}
                  onClick={handleBulkDelete}
                >
                  {t("delete")}
                </button>
              ) : bulkAction === "close" ? (
                <button
                  className={styles.confirmPrimaryBtn}
                  disabled={
                    !!actionLoading ||
                    !bulkCloseDateTime ||
                    selectedOpen.length === 0
                  }
                  onClick={handleBulkClose}
                >
                  {t("closeParking")}
                </button>
              ) : (
                <button
                  className={styles.confirmPrimaryBtn}
                  disabled={!!actionLoading || selectedCancelable.length === 0}
                  onClick={handleBulkCancel}
                >
                  {t("cancelParking")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitle}>
              {t("financeLocationParkingsList")} —{" "}
              <span className={styles.modalParkingName}>{parking.name}</span>
            </div>
            <button className={styles.modalClose} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          <div className={styles.modalMeta}>
            <span>
              {range.from} — {range.to}
            </span>
            {parking.tariff && (
              <span>
                {t("financeTariff")}: {fmt(parking.tariff.base_price)}{" "}
                {currency}
              </span>
            )}
            {parking.free_period != null && (
              <span>
                {t("freePeriod")}: {parking.free_period} {t("min")}
              </span>
            )}
            {parking.tariff && totalClosed > 0 && (
              <span className={styles.modalTotalRevenue}>
                {t("totalRevenue")}:{" "}
                <b>
                  {fmt(revenue)} {currency}
                </b>
              </span>
            )}
          </div>
          <div className={styles.modalFilters}>
            {[
              {
                key: "all",
                label: t("filterAll"),
                count: totalClosed + totalOpen,
              },
              {
                key: "closed",
                label: t("financeParkings"),
                count: totalClosed,
              },
              { key: "open", label: t("parkingOpen"), count: totalOpen },
            ]
              .filter(({ key }) => !closedOnly || key === "closed")
              .map(({ key, label, count }) => (
              <button
                key={key}
                className={`${styles.filterBtn} ${filter === key ? styles.filterBtnActive : ""} ${key === "open" && count > 0 ? styles.filterBtnOpen : ""}`}
                onClick={() => handleFilter(key)}
              >
                {label} <span className={styles.filterCount}>{count}</span>
              </button>
            ))}
            <div className={styles.plateSearchWrap}>
              <Search size={13} className={styles.plateSearchIcon} />
              <input
                type="text"
                className={styles.plateSearch}
                placeholder={t("plateNumber")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <button
              className={`${styles.sortToggleBtn} ${showSort ? styles.sortToggleBtnActive : ""}`}
              onClick={() => setShowSort((v) => !v)}
              title={t("sort") || "Sort"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M3 6h18M6 12h12M9 18h6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {showSort && (
            <div className={styles.sortRow}>
              {[
                { key: "plate", label: t("plateNumber") },
                { key: "date", label: t("date") },
                { key: "duration", label: t("parkingDuration") },
                { key: "price", label: t("financePrice") },
                { key: "status", label: t("status") },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`${styles.sortBtn} ${sortKey === key ? styles.sortBtnActive : ""}`}
                  onClick={() => handleSort(key)}
                >
                  {label}
                  {sortKey === key && (
                    <span className={styles.sortArrow}>{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {selected.size > 0 && (
            <div className={styles.bulkBar}>
              <span className={styles.bulkCount}>
                {t("selectedCount")}: <b>{selectedSessions.length}</b>
              </span>
              <button className={styles.bulkClearBtn} onClick={clearSelection}>
                {t("clearSelection")}
              </button>
              <div className={styles.bulkActions}>
                <button
                  className={`${styles.bulkBtn} ${styles.bulkBtnClose}`}
                  disabled={!!actionLoading || selectedOpen.length === 0}
                  onClick={() => startBulk("close")}
                  title={t("closeParking")}
                >
                  <Check size={14} />
                  {t("closeParking")} ({selectedOpen.length})
                </button>
                <button
                  className={`${styles.bulkBtn} ${styles.bulkBtnCancel}`}
                  disabled={!!actionLoading || selectedCancelable.length === 0}
                  onClick={() => startBulk("cancel")}
                  title={t("cancelParking")}
                >
                  <Undo2 size={14} />
                  {t("cancelParking")} ({selectedCancelable.length})
                </button>
                {canDelete && (
                  <button
                    className={`${styles.bulkBtn} ${styles.bulkBtnDelete}`}
                    disabled={!!actionLoading || selectedSessions.length === 0}
                    onClick={() => startBulk("delete")}
                    title={t("delete")}
                  >
                    <Trash2 size={14} />
                    {t("delete")} ({selectedSessions.length})
                  </button>
                )}
              </div>
            </div>
          )}
          {loading ? (
            <div className={styles.modalLoading}>
              <Loading />
            </div>
          ) : (
            <>
              <div className={styles.modalTableWrap}>
                <table className={styles.modalTable}>
                  <thead>
                    <tr>
                      <th className={styles.selectCell}>
                        <input
                          type="checkbox"
                          className={styles.rowCheckbox}
                          checked={pageAllSelected}
                          disabled={pageRows.length === 0}
                          onChange={togglePage}
                          title={t("selectAll")}
                        />
                      </th>
                      <th>№</th>
                      <th>{t("plateNumber")}</th>
                      <th>{t("entry")}</th>
                      <th style={{ width: 44 }}></th>
                      <th>{t("exit")}</th>
                      <th style={{ width: 44 }}></th>
                      <th>{t("parkingDuration")}</th>
                      <th>{t("financePrice")}</th>
                      <th>{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length > 0 ? (
                      pageRows.map((s, i) => {
                        const liveDuration = s.is_open && s.entry_time
                          ? Math.round((Date.now() - new Date(s.entry_time).getTime()) / 60000)
                          : s.duration_minutes;
                        const freePeriod = parking.free_period;
                        const freePeriodExpired = s.is_open && freePeriod != null && liveDuration > freePeriod;
                        return (
                        <tr
                          key={i}
                          className={`${s.is_open ? styles.openSessionRow : ""} ${
                            selected.has(rowKey(s)) ? styles.rowSelected : ""
                          }`}
                        >
                          <td className={styles.selectCell}>
                            <input
                              type="checkbox"
                              className={styles.rowCheckbox}
                              checked={selected.has(rowKey(s))}
                              onChange={() => toggleRow(s)}
                            />
                          </td>
                          <td>{(effectivePage - 1) * pageSize + i + 1}</td>
                          <td className={styles.modalPlate}>
                            {editingPlate?.key === (s.entry_id ?? s.exit_id) ? (
                              <div className={styles.inlinePlateForm}>
                                <input
                                  autoFocus
                                  className={styles.plateInput}
                                  value={editingPlate.value}
                                  onChange={(e) => setEditingPlate((p) => ({ ...p, value: e.target.value.toUpperCase() }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSavePlate();
                                    if (e.key === "Escape") setEditingPlate(null);
                                  }}
                                />
                                <button
                                  className={styles.confirmCloseBtn}
                                  disabled={actionLoading === "edit-plate"}
                                  onClick={handleSavePlate}
                                >
                                  ✓
                                </button>
                                <button
                                  className={styles.cancelCloseBtn}
                                  onClick={() => setEditingPlate(null)}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <span
                                className={canEdit ? styles.plateEditable : ""}
                                onDoubleClick={canEdit ? () => setEditingPlate({
                                  key: s.entry_id ?? s.exit_id,
                                  entryId: s.entry_id,
                                  exitId: s.exit_id,
                                  value: s.plate_number ?? "",
                                }) : undefined}
                              >
                                {fmtPlate(s.plate_number)}
                              </span>
                            )}
                          </td>
                          <td className={styles.modalDate}>
                            {fmtDate(s.entry_time)}
                          </td>
                          <td className={styles.photoCell}>
                            {s.entry_photo ? (
                              <img
                                className={styles.photoThumb}
                                src={`/api/vehicle-passes/image/${s.entry_photo}`}
                                alt=""
                                onClick={() =>
                                  setLightboxSrc(`/api/vehicle-passes/image/${s.entry_photo}`)
                                }
                              />
                            ) : (
                              <span className={styles.noPhoto}></span>
                            )}
                          </td>
                          <td className={styles.modalDate}>
                            {s.is_open ? (
                              <span className={styles.openBadge}>
                                {t("parkingOpen")}
                              </span>
                            ) : (
                              fmtDate(s.exit_time)
                            )}
                          </td>
                          <td className={styles.photoCell}>
                            {s.exit_photo ? (
                              <img
                                className={styles.photoThumb}
                                src={`/api/vehicle-passes/image/${s.exit_photo}`}
                                alt=""
                                onClick={() =>
                                  setLightboxSrc(`/api/vehicle-passes/image/${s.exit_photo}`)
                                }
                              />
                            ) : (
                              <span className={styles.noPhoto}></span>
                            )}
                          </td>
                          <td className={styles.modalDuration}>
                            {fmtDuration(liveDuration)}
                          </td>
                          <td className={styles.modalAmount}>
                            {s.is_open ? (
                              freePeriodExpired && parking.tariff && !s.is_no_tariff ? (
                                <span className={styles.revenue}>
                                  {fmt(parking.tariff.base_price)}{" "}
                                  <span className={styles.cur}>{currency}</span>
                                </span>
                              ) : (
                                "—"
                              )
                            ) : parking.tariff &&
                              !s.is_no_tariff &&
                              !s.is_free_period ? (
                              <span className={styles.revenue}>
                                {fmt(parking.tariff.base_price)}{" "}
                                <span className={styles.cur}>{currency}</span>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className={styles.actionsCell}>
                            {s.is_open ? (
                              closingEntryId === s.entry_id ? (
                                <div className={styles.inlineCloseForm}>
                                  <input
                                    type="datetime-local"
                                    className={styles.closeDtInput}
                                    value={closeDateTime}
                                    onChange={(e) =>
                                      setCloseDateTime(e.target.value)
                                    }
                                  />
                                  <button
                                    className={styles.confirmCloseBtn}
                                    disabled={
                                      !closeDateTime ||
                                      actionLoading ===
                                        `close-${s.plate_number}`
                                    }
                                    onClick={() =>
                                      handleCloseSession(
                                        s.plate_number,
                                        closeDateTime,
                                      )
                                    }
                                  >
                                    ✓
                                  </button>
                                  <button
                                    className={styles.cancelCloseBtn}
                                    onClick={() => setClosingEntryId(null)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className={styles.actionBtns}>
                                  <button
                                    className={styles.closeSessionBtn}
                                    disabled={!!actionLoading}
                                    onClick={() => startClose(s.entry_id)}
                                  >
                                    {t("closeParking")}
                                  </button>
                                  {canDelete && (
                                    <button
                                      className={styles.deleteFullBtn}
                                      disabled={!!actionLoading}
                                      onClick={() => setConfirmSession(s)}
                                      title={t("deleteBtn")}
                                    >
                                      <X size={13} />
                                      {t("deleteBtn")}
                                    </button>
                                  )}
                                </div>
                              )
                            ) : (
                              (s.is_manual || canDelete) && (
                                <div className={styles.actionBtns}>
                                  {s.is_manual && (
                                    <button
                                      className={styles.cancelParkingBtn}
                                      disabled={
                                        actionLoading === `cancel-${s.exit_id}`
                                      }
                                      onClick={() =>
                                        handleCancelSession(s.exit_id)
                                      }
                                      title={t("cancelParking")}
                                    >
                                      <Undo2 size={13} />
                                      {t("cancelParking")}
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      className={styles.deleteFullBtn}
                                      disabled={!!actionLoading}
                                      onClick={() => setConfirmSession(s)}
                                      title={t("deleteBtn")}
                                    >
                                      <X size={13} />
                                      {t("deleteBtn")}
                                    </button>
                                  )}
                                </div>
                              )
                            )}
                          </td>
                        </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10}>{t("noData")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className={styles.modalPagination}>
                <div className={styles.pageSizeWrap}>
                  <select
                    className={styles.pageSizeSelect}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className={styles.pageBtn}
                  disabled={effectivePage <= 1}
                  onClick={() => setPage(effectivePage - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className={styles.pageInfo}>
                  {effectivePage} / {totalPages || 1}
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={effectivePage >= totalPages}
                  onClick={() => setPage(effectivePage + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const FinancePage = () => {
  const { t } = useTranslation();
  const currentPath = window.location.pathname;
  const { canDelete, canEdit } = usePermissions(currentPath);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [preset, setPreset] = useState("today");
  const [range, setRange] = useState(getPresetRange("today"));
  const [modalParking, setModalParking] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const currency = t("currencySymbol");

  const fetchData = useCallback(
    async (r = range) => {
      if (!r.from || !r.to) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getFinanceSummary({ from: r.from, to: r.to });
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err.message || "Error");
      } finally {
        setLoading(false);
      }
    },
    [range],
  );

  useEffect(() => {
    fetchData(range);
  }, []);

  const handlePreset = (key) => {
    const r = getPresetRange(key);
    setPreset(key);
    setRange(r);
    fetchData(r);
  };

  const handleDateChange = (field, val) => {
    const r = { ...range, [field]: val };
    setRange(r);
    setPreset(null);
  };

  const handleApply = () => fetchData(range);

  const handleDownload = async () => {
    if (!data || downloadLoading) return;
    setDownloadLoading(true);
    try {
      const locationSessions = {};
      await Promise.all(
        (data.locations ?? []).map(async (loc) => {
          try {
            const res = await getFinanceLocationParkings({
              locationId: loc.id,
              from: range.from,
              to: range.to,
            });
            locationSessions[loc.id] = res.records;
          } catch {
            locationSessions[loc.id] = [];
          }
        })
      );
      exportFinanceExcel({ data, locationSessions, range, currency, t });
    } finally {
      setDownloadLoading(false);
    }
  };

  const totals = data?.totals ?? {};
  const locations = data?.locations ?? [];
  const dailyStats = data?.dailyStats ?? [];
  const hourlyStats = data?.hourlyStats ?? [];

  const chartParkings = locations
    .filter((p) => p.revenue > 0 || p.parkings > 0)
    .map((p) => ({ name: p.name, revenue: p.revenue, sessions: p.parkings }));

  const hasChart = chartParkings.length > 0;
  const hasDailyChart = dailyStats.length > 0;
  const hasHourlyChart = hourlyStats.length > 0;

  return (
    <>
      <div className={styles.page}>
        <div className={styles.main}>
          <PageHeader icon={TrendingUp} title={t("finance")} subtitle={t("pageSubtitleFinance")} color="#10b981" />
          {/* Fixed top: controls + KPI */}
          <div className={styles.stickyTop}>
            <div className={styles.controls}>
              <div className={styles.presets}>
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    className={`${styles.presetBtn} ${preset === p.key ? styles.presetActive : ""}`}
                    onClick={() => handlePreset(p.key)}
                  >
                    {t(p.label)}
                  </button>
                ))}
              </div>
              <div className={styles.datePickers}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={range.from}
                  max={range.to}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
                <span className={styles.dateSep}>—</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={range.to}
                  min={range.from}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
                <button className={styles.applyBtn} onClick={handleApply}>
                  {t("apply")}
                </button>
                <button
                  className={styles.refreshBtn}
                  onClick={() => fetchData(range)}
                  title={t("refresh")}
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  className={`${styles.downloadBtn} ${downloadLoading ? styles.downloadBtnLoading : ""}`}
                  onClick={handleDownload}
                  disabled={!data || downloadLoading}
                  title={t("downloadReport")}
                >
                  <Download size={14} className={downloadLoading ? styles.spinIcon : ""} />
                  <span>{t("downloadBtn")}</span>
                </button>
              </div>
            </div>

            {data && !loading && !error && (
              <div className={styles.kpiGrid}>
                <KpiCard
                  icon={TrendingUp}
                  color="#6366f1"
                  label={t("totalRevenue")}
                  value={fmt(totals.totalRevenue ?? 0)}
                  sub={currency}
                />
                <KpiCard
                  icon={Car}
                  color="#10b981"
                  label={t("financeParkings")}
                  value={fmt(totals.totalParkings ?? 0)}
                />
                <KpiCard
                  icon={ParkingCircle}
                  color="#f59e0b"
                  label={t("locations")}
                  value={totals.activeLocations ?? 0}
                />
                <KpiCard
                  icon={BarChart2}
                  color="#8b5cf6"
                  label={t("avgRevenuePerLocation")}
                  value={fmt(totals.avgRevenuePerLocation ?? 0)}
                  sub={currency}
                />
              </div>
            )}
          </div>

          {/* Scrollable: charts + table */}
          <div className={styles.scrollContent}>
            {loading ? (
              <Loading />
            ) : error ? (
              <div className={styles.errorBox}>{error}</div>
            ) : (
              <>
                {/* Charts row */}
                {(hasChart || hasDailyChart || hasHourlyChart) && (
                  <div className={styles.chartsRow}>
                    {hasChart && (
                      <div className={styles.chartCard}>
                        <div className={styles.chartTitle}>
                          {t("revenueByLocation")}
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart
                            data={chartParkings}
                            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--border-color)"
                            />
                            <XAxis
                              dataKey="name"
                              tick={{
                                fontSize: 11,
                                fill: "var(--text-secondary)",
                              }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{
                                fontSize: 11,
                                fill: "var(--text-secondary)",
                              }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => fmt(v)}
                              width={72}
                            />
                            <Tooltip
                              content={<CustomTooltip currency={currency} />}
                            />
                            <Bar
                              dataKey="revenue"
                              name={t("financeRevenue")}
                              fill="#6366f1"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={48}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {hasDailyChart && (
                      <div className={styles.chartCard}>
                        <div className={styles.chartTitle}>
                          {t("dailyChart")}
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart
                            data={dailyStats}
                            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--border-color)"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{
                                fontSize: 10,
                                fill: "var(--text-secondary)",
                              }}
                              tickLine={false}
                              tickFormatter={(v) => v.slice(5)}
                            />
                            <YAxis
                              tick={{
                                fontSize: 11,
                                fill: "var(--text-secondary)",
                              }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => fmt(v)}
                              width={72}
                            />
                            <Tooltip
                              content={<CustomTooltip currency={currency} />}
                            />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              name={t("financeRevenue")}
                              stroke="#6366f1"
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {hasHourlyChart && (
                      <div className={styles.chartCard}>
                        <div className={styles.chartTitle}>
                          {t("dailyChart")}
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart
                            data={hourlyStats}
                            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--border-color)"
                            />
                            <XAxis
                              dataKey="label"
                              tick={{
                                fontSize: 9,
                                fill: "var(--text-secondary)",
                              }}
                              tickLine={false}
                              interval={1}
                            />
                            <YAxis
                              tick={{
                                fontSize: 11,
                                fill: "var(--text-secondary)",
                              }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => fmt(v)}
                              width={72}
                            />
                            <Tooltip
                              content={<CustomTooltip currency={currency} />}
                            />
                            <Line
                              type="monotone"
                              dataKey="revenue"
                              name={t("financeRevenue")}
                              stroke="#6366f1"
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {/* Table */}
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>{t("name")}</th>
                        <th>{t("financeParkings")}</th>
                        <th>{t("financeRevenue")}</th>
                        <th>{t("financeTariff")}</th>
                        <th>{t("financeAvgPerDay")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.length > 0 ? (
                        locations.map((p, i) => (
                          <tr
                            key={p.id}
                            className={`${p.revenue > 0 ? styles.activeRow : ""} ${styles.clickableRow}`}
                            onClick={() => setModalParking(p)}
                          >
                            <td>{i + 1}</td>
                            <td className={styles.parkingName}>{p.name}</td>
                            <td>
                              <span className={styles.badge}>
                                {fmt(p.parkings)}
                              </span>
                            </td>
                            <td className={styles.revenueCell}>
                              {p.revenue > 0 ? (
                                <span className={styles.revenue}>
                                  {fmt(p.revenue)}{" "}
                                  <span className={styles.cur}>{currency}</span>
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {p.tariff ? (
                                <span className={styles.tariffType}>
                                  {fmt(p.tariff.base_price)}{" "}
                                  <span className={styles.cur}>{currency}</span>
                                </span>
                              ) : (
                                <span className={styles.noTariff}>
                                  {t("financeNoTariff")}
                                </span>
                              )}
                              {p.free_period != null && (
                                <div className={styles.freePeriodLabel}>
                                  {t("freePeriod")}: {p.free_period} {t("min")}
                                </div>
                              )}
                            </td>
                            <td>
                              {p.avgPerDay > 0 ? (
                                <span className={styles.avg}>
                                  {fmt(p.avgPerDay)}{" "}
                                  <span className={styles.cur}>{currency}</span>
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6}>{t("noData")}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {modalParking && (
        <SessionsModal
          parking={modalParking}
          range={range}
          currency={currency}
          onClose={() => setModalParking(null)}
          canDelete={canDelete}
          canEdit={canEdit}
        />
      )}
    </>
  );
};

export default FinancePage;
