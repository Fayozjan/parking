import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Pagination.module.scss";

const PAGE_SIZES = [50, 100, 200, 300, 400, 500];

// Выбор «на странице»: кастомный список вместо нативного select
const PageSizeSelect = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.sizeSelect} ref={ref}>
      <button
        type="button"
        className={`${styles.sizeTrigger} ${open ? styles.sizeTriggerOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <b>{value}</b>
        <span className={styles.sizeLabel}>{t("perPage")}</span>
        <ChevronDown size={14} className={styles.sizeChevron} />
      </button>
      {open && (
        <ul className={styles.sizeMenu}>
          {PAGE_SIZES.map((n) => (
            <li key={n}>
              <button
                type="button"
                className={`${styles.sizeOption} ${n === value ? styles.sizeOptionActive : ""}`}
                onClick={() => {
                  onChange(n);
                  setOpen(false);
                }}
              >
                {n}
                {n === value && <Check size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Pagination = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  handleChangePageSize,
  handlePageChange,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = () => {
    setDraft(String(currentPage));
    setEditing(true);
  };

  // Переход на введённую страницу (с ограничением 1…totalPages)
  const commit = () => {
    setEditing(false);
    const n = parseInt(draft, 10);
    if (Number.isNaN(n)) return;
    const page = Math.min(Math.max(n, 1), totalPages);
    if (page !== currentPage) handlePageChange(page);
  };

  const showSize = totalItems > 50;
  const showPages = totalPages > 1;
  if (!showSize && !showPages) return <div className={styles.pagination} />;

  return (
    <div className={styles.pagination}>
      <div className={styles.capsule}>
        {showSize && (
          <PageSizeSelect
            value={Number(pageSize)}
            onChange={(n) => handleChangePageSize({ target: { value: n } })}
          />
        )}

        {showPages && (
          <>
            <button
              type="button"
              className={styles.arrow}
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={15} />
            </button>

            <div className={styles.currentPage}>
              {editing ? (
                <input
                  className={styles.pageInput}
                  type="number"
                  min={1}
                  max={totalPages}
                  value={draft}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
              ) : (
                <b
                  className={styles.pageNum}
                  onClick={startEdit}
                  title={`1 – ${totalPages}`}
                >
                  {currentPage}
                </b>
              )}
              <span>/</span>
              <span>{totalPages}</span>
            </div>

            <button
              type="button"
              className={styles.arrow}
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Pagination;
