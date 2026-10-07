import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Trash2, Pencil } from "lucide-react";

import { getVehiclePasses, updateVehiclePass, deleteVehiclePass } from "../api/vehiclePasses";
import { getActiveLocations } from "../api";
import { useAlertStore } from "../stores/alertStore";
import { useScreenStack } from "../context/ScreenStackContext";
import { usePermissionsTelegram } from "../hooks/usePermissionsTelegram";

import Loading from "../components/Loading";
import { Icons } from "../icons/icons";

import styles from "./VehiclePassesPageTelegram.module.scss";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

const PAGE_SIZE = 50;

const parsePlate = (raw = "") => {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  let match = clean.match(/^(\d{2})([A-Z])(\d{3})([A-Z]{2})$/);
  if (match) {
    const region = match[1],
      series = match[2],
      number = match[3],
      suffix = match[4];
    return {
      region,
      series,
      number,
      suffix,
      formatted: `${region} ${series} ${number} ${suffix}`,
    };
  }

  match = clean.match(/^(\d{2})(\d{3})([A-Z]{3})$/);
  if (match) {
    const region = match[1],
      number = match[2],
      suffix = match[3];
    return {
      region,
      series: null,
      number,
      suffix,
      formatted: `${region} ${number} ${suffix}`,
    };
  }

  match = clean.match(/^(\d{3,4})([A-Z]{2})(\d{2})$/);
  if (match) {
    const region = match[3],
      number = match[1],
      suffix = match[2];
    return {
      region,
      series: null,
      number,
      suffix,
      formatted: `${region} ${number} ${suffix}`,
    };
  }

  return {
    region: null,
    series: null,
    number: raw || "—",
    suffix: null,
    formatted: raw || "—",
  };
};

const PRESETS = [
  { key: "today", labelKey: "financeToday" },
  { key: "yesterday", labelKey: "financeYesterday" },
  { key: "week", labelKey: "financeLast7" },
  { key: "month", labelKey: "financeThisMonth" },
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
  return {};
};

// ── Main page ──────────────────────────────────────────────────────────────────
const VehiclePassesPageTelegram = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [data, setData] = useState([]);
  const [gates, setGates] = useState([]);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, entries: 0, exits: 0 });
  const [activePreset, setActivePreset] = useState("today");

  const { showAlert } = useAlertStore();
  const { t } = useTranslation();
  const { pushScreen, popScreen } = useScreenStack();
  const location = useLocation();
  const { canEdit, canDelete } = usePermissionsTelegram(location.pathname);

  const scrollRef = useRef(null);
  const listRef = useRef(null);
  const observerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const currentPageRef = useRef(1);

  const [searchQuery, setSearchQuery] = useState("");
  const searchQueryRef = useRef("");

  const today = new Date().toISOString().slice(0, 10);

  const initialFormData = {
    start_date: `${today} 00:00`,
    end_date: `${today} 23:59`,
    branch_id: null,
    direction: "",
    selectedLocationIds: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const formDataRef = useRef(initialFormData);

  // ── Active filters count ─────────────────────────────────────────────────────
  const countActiveFilters = (fd) => {
    let count = 0;
    if (fd.start_date) count++;
    if (fd.branch_id) count++;
    if (fd.direction) count++;
    if (fd.selectedLocationIds?.length) count++;
    return count;
  };

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchEvents = async (page = 1, filters = formDataRef.current) => {
    if (loadingMoreRef.current || (page > 1 && !hasMoreRef.current)) return;

    if (page === 1) {
      setLoading(true);
      hasMoreRef.current = true;
    } else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    try {
      const { data: events, pagination } = await getVehiclePasses({
        page,
        pageSize: PAGE_SIZE,
        filters: { ...filters, search: searchQueryRef.current },
      });

      const list = events || [];
      const totalPages = pagination?.totalPages || 1;

      setData((prev) => (page === 1 ? list : [...prev, ...list]));
      currentPageRef.current = page;
      hasMoreRef.current = page < totalPages;

      if (page === 1) {
        setStats({
          total: pagination?.totalItems || 0,
          entries: pagination?.totalEntries || 0,
          exits: pagination?.totalExits || 0,
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert(t("errorLoading"), "error");
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const gatesRes = await getActiveLocations();
      if (gatesRes?.success) setGates(gatesRes.data);
    } catch (err) {
      console.error("Ошибка загрузки ворот:", err.message);
    }
  };

  const handleEdit = async (id, plate_number) => {
    try {
      await updateVehiclePass(id, { plate_number });
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, plate_number } : item)),
      );
      showAlert(t("success"), "success");
    } catch (err) {
      console.error(err);
      showAlert(t("error"), "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await deleteVehiclePass(id);
      setData((prev) => prev.filter((item) => item.id !== id));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
      showAlert(t("success"), "success");
    } catch (err) {
      console.error(err);
      showAlert(t("error"), "error");
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);
  useEffect(() => {
    fetchEvents(1);
  }, []);

  const sentinelRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMoreRef.current &&
            !loadingMoreRef.current
          ) {
            fetchEvents(currentPageRef.current + 1);
          }
        },
        { root: listRef.current, rootMargin: "400px" },
      );

      if (node) observerRef.current.observe(node);
    },
    [loading],
  );

  // ── Search: debounced ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      searchQueryRef.current = searchQuery;
      fetchEvents(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Preset handler ──────────────────────────────────────────────────────────
  const handlePreset = (key) => {
    const dates = getPresetDates(key);
    const newFormData = { ...formData, ...dates };
    setFormData(newFormData);
    formDataRef.current = newFormData;
    setActivePreset(key);
    setActiveFiltersCount(countActiveFilters(newFormData));
    fetchEvents(1, newFormData);
  };

  // ── Open filter screen ───────────────────────────────────────────────────────
  const openFilter = () => {
    pushScreen(
      "filter",
      <FilterScreen
        gates={gates}
        formData={formData}
        initialFormData={initialFormData}
        onApply={(newFilters) => {
          setFormData(newFilters);
          formDataRef.current = newFilters;
          setActivePreset(null);
          setActiveFiltersCount(countActiveFilters(newFilters));
          fetchEvents(1, newFilters);
          popScreen();
        }}
        onClose={popScreen}
        t={t}
      />,
    );
  };

  usePullToRefresh(() => fetchEvents(), scrollRef, loading);

  return (
    <div className={styles.page}>
      <div className={styles.header} />

      <div className={styles.main} id="scroll-container" ref={scrollRef}>
        <div className={styles.statsRow}>
          <div className={styles.statWidget}>
            <div className={styles.statWidgetIcon} style={{ background: "rgba(99,102,241,0.1)" }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M5 11l1.5-4.5h11L19 11" strokeLinecap="round" />
                <rect x="3" y="11" width="18" height="7" rx="2" />
                <circle cx="7.5" cy="18" r="1.5" />
                <circle cx="16.5" cy="18" r="1.5" />
              </svg>
            </div>
            <div className={styles.statWidgetContent}>
              <span className={styles.statWidgetLabel}>{t("totalPassesLabel")}</span>
              <span className={styles.statWidgetValue}>{stats.total}</span>
            </div>
          </div>
          <div className={styles.statWidget}>
            <div className={styles.statWidgetIcon} style={{ background: "rgba(16,185,129,0.1)" }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            <div className={styles.statWidgetContent}>
              <span className={styles.statWidgetLabel}>{t("entry")}</span>
              <span className={styles.statWidgetValue} style={{ color: "#10b981" }}>{stats.entries}</span>
            </div>
          </div>
          <div className={styles.statWidget}>
            <div className={styles.statWidgetIcon} style={{ background: "rgba(245,158,11,0.1)" }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
            <div className={styles.statWidgetContent}>
              <span className={styles.statWidgetLabel}>{t("exit")}</span>
              <span className={styles.statWidgetValue} style={{ color: "#f59e0b" }}>{stats.exits}</span>
            </div>
          </div>
        </div>

        <div className={styles.stickyControls}>
          <div className={styles.presetsRow}>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`${styles.presetBtn} ${activePreset === p.key ? styles.presetActive : ""}`}
                onClick={() => handlePreset(p.key)}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>

          <div className={styles.searchFilterRow}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>{Icons.search}</span>
              <input
                type="text"
                placeholder={t("search") || "Поиск..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.length > 0 && (
                <button
                  className={styles.clearBtn}
                  onClick={() => setSearchQuery("")}
                >
                  {Icons.clear}
                </button>
              )}
            </div>

            <button
              className={`${styles.filterBtn} ${activeFiltersCount > 0 ? styles.filterBtnActive : ""}`}
              onClick={openFilter}
            >
              {Icons.filter ?? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
              )}
              {activeFiltersCount > 0 && <span className={styles.filterBadge} />}
            </button>
          </div>

          {/* Active filter tags */}
          {activeFiltersCount > 0 && (
            <div className={styles.activeFiltersBar}>
            {(formData.start_date !== initialFormData.start_date ||
              formData.end_date !== initialFormData.end_date) && (
              <span className={styles.activeFilterTag}>
                {formData.start_date &&
                  `${t("filterFrom")}: ${new Date(
                    formData.start_date,
                  ).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
                {formData.end_date &&
                  ` ${t("filterTo")}: ${new Date(
                    formData.end_date,
                  ).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
                <button
                  onClick={() => {
                    const next = {
                      ...formData,
                      start_date: initialFormData.start_date,
                      end_date: initialFormData.end_date,
                    };
                    setFormData(next);
                    formDataRef.current = next;
                    setActiveFiltersCount(countActiveFilters(next));
                    fetchEvents(1, next);
                  }}
                >
                  {Icons.clear}
                </button>
              </span>
            )}

            {formData.direction && (
              <span className={styles.activeFilterTag}>
                {formData.direction === "entry" ? t("forward") : t("reverse")}
                <button
                  onClick={() => {
                    const next = { ...formData, direction: "" };
                    setFormData(next);
                    formDataRef.current = next;
                    setActiveFiltersCount(countActiveFilters(next));
                    fetchEvents(1, next);
                  }}
                >
                  {Icons.clear}
                </button>
              </span>
            )}

            {formData.selectedLocationIds?.length > 0 && (
              <span className={styles.activeFilterTag}>
                {gates
                  .filter((g) =>
                    formData.selectedLocationIds.includes(String(g.id)),
                  )
                  .map((g) => g.name)
                  .join(", ") || t("location")}
                <button
                  onClick={() => {
                    const next = { ...formData, selectedLocationIds: [] };
                    setFormData(next);
                    formDataRef.current = next;
                    setActiveFiltersCount(countActiveFilters(next));
                    fetchEvents(1, next);
                  }}
                >
                  {Icons.clear}
                </button>
              </span>
            )}
            </div>
          )}
        </div>

        {/* Card list */}
        {loading ? (
          <div className={styles.centerLoading}>
            <Loading />
          </div>
        ) : (
          <div className={styles.cardList} ref={listRef}>
            {data.length === 0 && <p className={styles.empty}>{t("noData")}</p>}
            {data.map((event, idx) => (
              <VehicleCard
                key={event.id || idx}
                innerRef={idx === data.length - 5 ? sentinelRef : null}
                event={event}
                t={t}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            {loadingMore && (
              <div className={styles.bottomLoader}>
                <span className={styles.bottomLoaderDot} />
                <span className={styles.bottomLoaderDot} />
                <span className={styles.bottomLoaderDot} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Filter screen ──────────────────────────────────────────────────────────────
const FilterScreen = ({ gates, formData, initialFormData, onApply, t }) => {
  const [localForm, setLocalForm] = useState(formData);

  useEffect(() => {
    setLocalForm(formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleReset = () => setLocalForm(initialFormData);

  const toggleLocation = (id) => {
    const strId = String(id);
    setLocalForm((prev) => {
      const current = prev.selectedLocationIds || [];
      return {
        ...prev,
        selectedLocationIds: current.includes(strId)
          ? current.filter((x) => x !== strId)
          : [...current, strId],
      };
    });
  };

  const hasChanges =
    JSON.stringify(localForm) !== JSON.stringify(initialFormData);

  return (
    <div className={styles.filterPage}>
      <div className={styles.filterHeader}>
        {hasChanges && (
          <button className={styles.resetBtn} onClick={handleReset}>
            {t("clearAll") || "Сбросить"}
          </button>
        )}
      </div>

      <div className={styles.filterBody}>
        <div className={styles.filterCard}>
          <div className={styles.filterCardHeader}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{t("period") || "Период"}</span>
          </div>
          <div className={styles.filterRow}>
            <div className={styles.filterField}>
              <label className={styles.fieldLabel}>{t("filterFrom")}</label>
              <input
                className={styles.dateInput}
                type="datetime-local"
                name="start_date"
                value={localForm.start_date}
                onChange={handleChange}
                onFocus={(e) => e.target.showPicker?.()}
              />
            </div>
            <div className={styles.filterField}>
              <label className={styles.fieldLabel}>{t("filterTo")}</label>
              <input
                className={styles.dateInput}
                type="datetime-local"
                name="end_date"
                value={localForm.end_date}
                onChange={handleChange}
                onFocus={(e) => e.target.showPicker?.()}
              />
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterCardHeader}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{t("location")}</span>
          </div>
          <div className={styles.chipGroup}>
            {gates.map((gate) => {
              const selected = (localForm.selectedLocationIds || []).includes(
                String(gate.id),
              );
              return (
                <button
                  key={gate.id}
                  className={`${styles.chip} ${selected ? styles.chipActive : ""}`}
                  onClick={() => toggleLocation(gate.id)}
                >
                  {gate.name}
                  {selected && (
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterCardHeader}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="7 8 12 3 17 8" />
              <polyline points="17 16 12 21 7 16" />
            </svg>
            <span>{t("direction")}</span>
          </div>
          <div className={styles.directionGroup}>
            {[
              { value: "", label: t("all"), color: null },
              { value: "entry", label: t("forward"), color: "#10b981" },
              { value: "exit", label: t("reverse"), color: "#ef4444" },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                className={`${styles.dirBtn} ${localForm.direction === value ? styles.dirBtnActive : ""}`}
                style={
                  localForm.direction === value && color
                    ? { borderColor: color, color, background: `${color}15` }
                    : undefined
                }
                onClick={() =>
                  setLocalForm((prev) => ({ ...prev, direction: value }))
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.filterFooter}>
        <button className={styles.applyBtn} onClick={() => onApply(localForm)}>
          {t("apply") || "Применить"}
        </button>
      </div>
    </div>
  );
};

// ── Vehicle Card ───────────────────────────────────────────────────────────────
const VehicleCard = ({ event, t, innerRef, canEdit, canDelete, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPlate, setEditPlate] = useState(event?.plate_number || "");

  const plate = parsePlate(event?.plate_number);
  const locationName = event.location_name || "";
  const formattedTime = event.date;

  const startEdit = () => {
    setEditPlate(event?.plate_number || "");
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (onEdit) onEdit(event.id, editPlate);
    setIsEditing(false);
  };

  return (
    <div className={styles.card} ref={innerRef}>
      <div className={styles.cardPhoto}>
        {event.photo ? (
          <img
            src={`/api/vehicle-passes/image/${event.photo}`}
            alt={plate.formatted}
            loading="lazy"
          />
        ) : (
          <div className={styles.cardPhotoPlaceholder}>
            <svg viewBox="0 0 24 24" width="32" height="32">
              <path
                fill="currentColor"
                d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3h2l3 4v3h-2a3 3 0 0 1-6 0H8a3 3 0 0 1-6 0m0 0a3 3 0 0 0 6 0M3 5v10h1.1A3 3 0 0 1 7 13a3 3 0 0 1 2.9 2H14V5zm15 9.5a1.5 1.5 0 0 0-3 0a1.5 1.5 0 0 0 3 0M8.5 16.5A1.5 1.5 0 0 0 7 15a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 7 18a1.5 1.5 0 0 0 1.5-1.5M15 9v2h3.5L17 9z"
              />
            </svg>
          </div>
        )}

        <div
          className={`${styles.cardDirectionBadge} ${
            event.direction === "entry"
              ? styles.dirIn
              : event.direction === "exit"
                ? styles.dirOut
                : styles.dirDefault
          }`}
        >
          {event.direction === "entry"
            ? t("entry")
            : event.direction === "exit"
              ? t("exit")
              : t("unknown")}
        </div>

        {(canDelete || canEdit) && (
          <div className={styles.cardPhotoActions}>
            {canEdit && onEdit && !isEditing && (
              <button
                className={styles.cardPhotoEditBtn}
                onClick={startEdit}
                title={t("edit")}
              >
                <Pencil size={13} />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                className={styles.cardPhotoDeleteBtn}
                onClick={() => onDelete(event.id)}
                title={t("delete")}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className={styles.plateEditWrap}>
          <input
            autoFocus
            className={styles.plateInput}
            value={editPlate}
            onChange={(e) => setEditPlate(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
          />
          <button className={styles.savePlateBtn} onClick={saveEdit}>✓</button>
          <button className={styles.cancelPlateBtn} onClick={() => setIsEditing(false)}>✕</button>
        </div>
      ) : (
        <div className={styles.cardPlate}>
          {plate.region && (
            <span className={styles.plateRegion}>{plate.region}</span>
          )}
          {plate.region && <div className={styles.plateDivider} />}
          {plate.series && (
            <span className={styles.plateSeries}>{plate.series}</span>
          )}
          <span className={styles.plateNumber}>{plate.number}</span>
          {plate.suffix && (
            <span className={styles.plateSuffix}>{plate.suffix}</span>
          )}
          <div className={styles.plateUzBlock}>
            <div className={styles.plateFlag}>
              <div className={styles.flagBlue} />
              <div className={styles.flagWhite} />
              <div className={styles.flagGreen} />
            </div>
            <span className={styles.plateUz}>uz</span>
          </div>
        </div>
      )}

      <div className={styles.cardDetails}>
        <div className={styles.cardDetailRow}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
            <rect x="3" y="4" width="2.5" height="16" rx="1" fill="currentColor" />
            <rect x="4.25" y="5.5" width="2" height="2.5" rx="1" fill="currentColor" />
            <line x1="5.5" y1="6.75" x2="19" y2="3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="4.5" cy="13" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className={styles.cardDetailLabel}>{t("location")}</span>
          <span className={styles.cardDetailValue}>{locationName || "—"}</span>
        </div>

        <div className={styles.cardDetailRow}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8s8 3.58 8 8s-3.58 8-8 8zm.5-13H11v6l5.25 3.15l.75-1.23l-4.5-2.67z"
            />
          </svg>
          <span className={styles.cardDetailLabel}>{t("time")}</span>
          <span className={styles.cardDetailValue}>{formattedTime || "—"}</span>
        </div>
      </div>
    </div>
  );
};

export default VehiclePassesPageTelegram;
