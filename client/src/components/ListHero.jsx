import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, Plus, RefreshCw, Search } from "lucide-react";

import PageHero from "./PageHero";
import hc from "../styles/heroControls.module.scss";

// Шапка списковой страницы: поиск, «Фильтры» (выпадающее окно), «Добавить»,
// обновление и пагинация по центру. Содержимое окна фильтров — filterContent.
const ListHero = ({
  icon,
  title,
  subtitle,
  pagination,
  searchValue,
  onSearchInput,
  onSearch,
  filterContent,
  activeFilters = 0,
  onApplyFilters,
  onResetFilters,
  onAdd,
  onRefresh,
  children,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);
  const btnRef = useRef(null);
  const timer = useRef(null);
  const latestSearch = useRef(onSearch);
  latestSearch.current = onSearch;

  const handleInput = (e) => {
    const value = e.target.value;
    onSearchInput?.(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => latestSearch.current?.(value), 1000);
  };

  const handleKey = (e) => {
    if (e.key !== "Enter") return;
    clearTimeout(timer.current);
    latestSearch.current?.(e.target.value);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  // Окно фильтров: закрытие по клику вне и Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const el = e.target;
      if (popRef.current?.contains(el) || btnRef.current?.contains(el)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={hc.heroWrap}>
      <PageHero icon={icon} title={title} subtitle={subtitle} center={pagination}>
        {onSearch && (
          <div className={hc.heroSearch}>
            <Search size={15} />
            <input
              type="text"
              placeholder={t("search")}
              value={searchValue || ""}
              onChange={handleInput}
              onKeyDown={handleKey}
            />
          </div>
        )}
        {filterContent && (
          <button
            type="button"
            ref={btnRef}
            className={`${hc.heroBtn} ${open ? hc.heroBtnOn : ""}`}
            onClick={() => setOpen((v) => !v)}
          >
            <Filter size={15} />
            <span>{t("filters")}</span>
            {activeFilters > 0 && <span className={hc.filterCount}>{activeFilters}</span>}
          </button>
        )}
        {children}
        {onAdd && (
          <button type="button" className={hc.heroBtn} onClick={onAdd}>
            <Plus size={15} />
            <span>{t("add")}</span>
          </button>
        )}
        {onRefresh && (
          <button
            type="button"
            className={hc.heroIconBtn}
            onClick={onRefresh}
            title={t("refresh")}
            aria-label={t("refresh")}
          >
            <RefreshCw size={16} />
          </button>
        )}
      </PageHero>

      {open && filterContent && (
        <div className={hc.filterPopover} ref={popRef}>
          {filterContent}
          <div className={hc.filterFoot}>
            <button
              type="button"
              className={hc.filterReset}
              onClick={() => {
                setOpen(false);
                onResetFilters?.();
              }}
            >
              {t("resetAllFilters")}
            </button>
            <button
              type="button"
              className={hc.filterApply}
              onClick={() => {
                setOpen(false);
                onApplyFilters?.();
              }}
            >
              {t("apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Подпись + поле внутри окна фильтров
export const FilterField = ({ label, wide, children }) => (
  <div className={`${hc.field} ${wide ? hc.wide : ""}`}>
    <span>{label}</span>
    {children}
  </div>
);

// Сегментированный переключатель («Все / Включён / Отключён»)
export const FilterSegment = ({ value, options, onChange }) => (
  <div className={hc.segment}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        className={value === o.value ? hc.segmentOn : ""}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// Сетка 2 колонки для полей окна фильтров
export const FilterGrid = ({ children }) => <div className={hc.grid2}>{children}</div>;

// Итоги внизу страницы одной строкой текста: [{ label, value, sub, tone: "ok" | "bad" }]
export const StatsLine = ({ items }) => (
  <div className={hc.statsLine}>
    {items.map((it, i) => (
      <Fragment key={it.label}>
        {i > 0 && <i />}
        <span className={it.tone === "ok" ? hc.statOk : it.tone === "bad" ? hc.statBad : ""}>
          {it.label} <b>{it.value}</b>
          {it.sub != null && <> / {it.sub}</>}
        </span>
      </Fragment>
    ))}
  </div>
);

export { hc as heroControlStyles };
export default ListHero;
