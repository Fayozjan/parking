import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./Dropdown.module.scss";

// Single-select dropdown: pill trigger + styled options popup.
// options: [{ value, label }]
const Dropdown = ({ options, value, onChange, placeholder, title, minWidth, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState("down");
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const toggle = () => {
    if (!isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom;
      setOpenDirection(below < 220 && rect.top > below ? "up" : "down");
    }
    setIsOpen((o) => !o);
  };

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`${styles.dropdown} ${className ?? ""}`} style={{ minWidth }}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ""}`}
        onClick={toggle}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.label}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown size={15} strokeWidth={2.4} className={styles.chevron} />
      </button>
      {isOpen && (
        <ul
          role="listbox"
          className={`${styles.menu} ${styles[openDirection]}`}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li
                key={String(o.value)}
                role="option"
                aria-selected={active}
                className={`${styles.option} ${active ? styles.active : ""}`}
                onClick={() => {
                  setIsOpen(false);
                  if (!active) onChange(o.value);
                }}
              >
                <span>{o.label}</span>
                {active && <Check size={15} strokeWidth={2.6} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
