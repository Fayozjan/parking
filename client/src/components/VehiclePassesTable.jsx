import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Trash2, Pencil, Sparkles, TriangleAlert, History, HandHelping, ScanText } from "lucide-react";

import Badge from "./Badge";
import UzPlate from "./UzPlate";
import SortArrow from "./SortArrow";

import styles from "./VehiclePassesTable.module.scss";

// Рейтинг достоверности фиксации (0–100): уверенность камеры + бонус за вторую камеру ворот
const getScoreLevel = (score) => {
  if (score >= 85) return "scoreHigh";
  if (score >= 60) return "scoreMedium";
  return "scoreLow";
};

const ScoreBadge = ({ event, styles, t }) => {
  if (event.score === null || event.score === undefined) return <>—</>;
  return (
    <span
      className={`${styles.scoreBadge} ${styles[getScoreLevel(event.score)]}`}
      title={
        event.gate_confirmed
          ? `${t("cameraConfidence")}: ${event.confidence}% · ${t("gateConfirmed")}`
          : `${t("cameraConfidence")}: ${event.confidence}%`
      }
    >
      {event.score}
      {event.gate_confirmed && <span className={styles.scoreConfirmed}>✓✓</span>}
    </span>
  );
};

// Состояния проезда: командная работа камер ворот и сверка с AI
const FLAG_ICONS = {
  conflict: TriangleAlert,
  history: History,
  aiDir: Sparkles,
  plateFix: ScanText,
  helper: HandHelping,
};

const PassFlags = ({ event, styles, t, compact = false }) => {
  const dirLabel = (d) => (d === "entry" ? t("entry") : d === "exit" ? t("exit") : t("unknown"));
  const flags = [];
  if (event.plate_conflict)
    flags.push({ icon: "conflict", cls: "flagDanger", label: t("passFlagPlateConflict"), hint: t("passFlagPlateConflictHint") });
  if (event.history_conflict)
    flags.push({ icon: "history", cls: "flagWarn", label: t("passFlagHistory"), hint: t("passFlagHistoryHint") });
  if (event.direction_source === "ai" && event.direction_original)
    flags.push({
      icon: "aiDir",
      cls: "flagAi",
      label: t("passFlagAiDirection"),
      hint: t("passFlagAiDirectionHint", { from: dirLabel(event.direction_original) }),
    });
  if (event.plate_original)
    flags.push({
      icon: "plateFix",
      cls: "flagAi",
      label: t("passFlagPlateFixed"),
      hint: t("passFlagPlateFixedHint", { plate: event.plate_original }),
    });
  if (event.inferred && !event.gate_confirmed)
    flags.push({ icon: "helper", cls: "flagHelper", label: t("passFlagHelper"), hint: t("passFlagHelperHint") });
  if (compact) {
    // Компактно: только иконки в строке фиксированной высоты — карточки одной высоты
    return (
      <div className={styles.flagsCompact}>
        {flags.map((f) => {
          const Icon = FLAG_ICONS[f.icon];
          return (
            <span
              key={f.label}
              className={`${styles.flagIcon} ${styles[f.cls]}`}
              title={`${f.label} — ${f.hint}`}
            >
              <Icon size={13} strokeWidth={2.2} />
            </span>
          );
        })}
      </div>
    );
  }
  if (flags.length === 0) return null;
  return (
    <div className={styles.flags}>
      {flags.map((f) => (
        <span key={f.label} className={`${styles.flag} ${styles[f.cls]}`} title={f.hint}>
          {f.label}
        </span>
      ))}
    </div>
  );
};

const VehiclePassesTable = ({
  data,
  currentPage,
  pageSize,
  viewType = "row",
  canDelete = false,
  onDelete,
  canEdit = false,
  onEdit,
}) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e) => { if (e.key === "Escape") setLightboxSrc(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxSrc]);

  const getSortedData = () => {
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (sortField === "date") {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
        }
      }

      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      const isNumberA = !isNaN(aNum);
      const isNumberB = !isNaN(bNum);

      if (isNumberA && isNumberB) {
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      }

      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal), "ru", {
            sensitivity: "base",
          })
        : String(bVal).localeCompare(String(aVal), "ru", {
            sensitivity: "base",
          });
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

  const sortedData = getSortedData();

  const lightbox = lightboxSrc && (
    <div className={styles.lightboxOverlay} onClick={() => setLightboxSrc(null)}>
      <button className={styles.lightboxClose} onClick={() => setLightboxSrc(null)}>
        <X size={20} />
      </button>
      <img
        className={styles.lightboxImg}
        src={lightboxSrc}
        alt=""
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );

  if (viewType === "card") {
    return (
      <>
        {lightbox}
        <div className={styles.cardGrid}>
        {sortedData.length > 0 ? (
          sortedData.map((event) => {
            return (
              <div key={event.identifier} className={styles.card}>
                {/* Photo */}
                <div className={styles.cardPhoto}>
                  {event.photo ? (
                    <img
                      src={`/api/vehicle-passes/image/${event.photo}`}
                      loading="lazy"
                      decoding="async"
                      style={{ cursor: "pointer" }}
                      onClick={() => setLightboxSrc(`/api/vehicle-passes/image/${event.photo}`)}
                    />
                  ) : (
                    <div className={styles.cardPhotoPlaceholder}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3h2l3 4v3h-2a3 3 0 0 1-6 0H8a3 3 0 0 1-6 0m0 0a3 3 0 0 0 6 0M3 5v10h1.1A3 3 0 0 1 7 13a3 3 0 0 1 2.9 2H14V5zm15 9.5a1.5 1.5 0 0 0-3 0a1.5 1.5 0 0 0 3 0M8.5 16.5A1.5 1.5 0 0 0 7 15a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 7 18a1.5 1.5 0 0 0 1.5-1.5M15 9v2h3.5L17 9z"
                        />
                      </svg>
                    </div>
                  )}

                  <div
                    className={`${styles.cardDirectionBadge} ${
                      event?.direction === "entry"
                        ? styles.dirIn
                        : event?.direction === "exit"
                          ? styles.dirOut
                          : styles.dirUnknown
                    }`}
                  >
                    {event?.direction === "entry"
                      ? t("entry")
                      : event?.direction === "exit"
                        ? t("exit")
                        : t("unknown")}
                  </div>

                  <PassFlags event={event} styles={styles} t={t} compact />

                  {event.score != null && (
                    <div className={styles.cardScore} title={t("passScore")}>
                      <ScoreBadge event={event} styles={styles} t={t} />
                    </div>
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
                  {canEdit && onEdit && (
                    <button
                      className={styles.cardPhotoEditBtn}
                      onClick={() => onEdit(event.id)}
                      title={t("edit")}
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>

                {/* Vehicle number (license plate style) */}
                <div className={styles.cardPlateWrap}>
                  <UzPlate plate={event.plate_number} />
                </div>

                {/* Card details */}
                <div className={styles.cardDetails}>
                  <div className={styles.cardDetailRow}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="2.5"
                        height="16"
                        rx="1"
                        fill="currentColor"
                      />
                      <rect
                        x="4.25"
                        y="5.5"
                        width="2"
                        height="2.5"
                        rx="1"
                        fill="currentColor"
                      />
                      <line
                        x1="5.5"
                        y1="6.75"
                        x2="19"
                        y2="3.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="4.5"
                        cy="13"
                        r="1.8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <span className={styles.cardDetailLabel}>
                      {t("locations")}
                    </span>
                    <span className={styles.cardDetailValue}>
                      {event.location_name || "—"}
                    </span>
                  </div>

                  <div className={styles.cardDetailRow}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8s8 3.58 8 8s-3.58 8-8 8zm.5-13H11v6l5.25 3.15l.75-1.23l-4.5-2.67z"
                      />
                    </svg>
                    <span className={styles.cardDetailLabel}>{t("time")}</span>
                    <span className={styles.cardDetailValue}>
                      {event.date || "—"}
                    </span>
                  </div>

                </div>

              </div>
            );
          })
        ) : (
          <div className={styles.cardEmpty}>{t("noData")}</div>
        )}
        </div>
      </>
    );
  }

  return (
    <>
      {lightbox}
      <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>№</th>
            <th onClick={() => handleSort("plate_number")}>
              <span className={styles.headerContent}>
                {t("vehicle")}
                <SortArrow
                  active={sortField === "plate_number"}
                  order={sortOrder}
                />
              </span>
            </th>
            <th onClick={() => handleSort("location_name")}>
              <span className={styles.headerContent}>
                {t("locations")}
                <SortArrow
                  active={sortField === "location_name"}
                  order={sortOrder}
                />
              </span>
            </th>
            <th onClick={() => handleSort("direction")}>
              <span className={styles.headerContent}>
                {t("direction")}
                <SortArrow
                  active={sortField === "direction"}
                  order={sortOrder}
                />
              </span>
            </th>
            <th onClick={() => handleSort("date")}>
              <span className={styles.headerContent}>
                {t("time")}
                <SortArrow active={sortField === "date"} order={sortOrder} />
              </span>
            </th>
            <th onClick={() => handleSort("score")}>
              <span className={styles.headerContent}>
                {t("passScore")}
                <SortArrow active={sortField === "score"} order={sortOrder} />
              </span>
            </th>
            <th>{t("image")}</th>
            {canDelete && <th></th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((event, i) => {
                return (
                <tr key={event.identifier}>
                  <td>{(currentPage - 1) * pageSize + i + 1}</td>
                  <td>
                    <div className={styles.plateCell}>
                      <UzPlate plate={event.plate_number} size="sm" />
                      {canEdit && onEdit && (
                        <button
                          className={styles.editPlateBtn}
                          onClick={() => onEdit(event.id)}
                          title={t("edit")}
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>
                    <PassFlags event={event} styles={styles} t={t} />
                  </td>
                  <td>{event.location_name}</td>
                  <td>
                    <Badge text={event?.direction} />
                  </td>
                  <td>{event.date}</td>
                  <td>
                    <ScoreBadge event={event} styles={styles} t={t} />
                  </td>
                  <td>
                    {event?.photo && (
                      <img
                        src={`/api/vehicle-passes/image/${event.photo}`}
                        loading="lazy"
                        decoding="async"
                        style={{ cursor: "pointer" }}
                        onClick={() => setLightboxSrc(`/api/vehicle-passes/image/${event.photo}`)}
                      />
                    )}
                  </td>
                  {canDelete && onDelete && (
                    <td>
                      <button
                        className={styles.rowDeleteBtn}
                        onClick={() => onDelete(event.id)}
                        title={t("delete")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="11">{t("noData")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default VehiclePassesTable;
