import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, matchPath } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Car, Settings, Circle, LayoutDashboard, Sun, Moon } from "lucide-react";
import Profile from "./Profile";
import { useAuthStore } from "../stores/authStore";
import { updateProfile } from "../api/users";
import styles from "./TopNav.module.scss";

// Иконки пунктов меню по ключу name
const NAV_ICONS = {
  "vehicle-passes": Car,
  settings: Settings,
};

// Круглая кнопка в правом нижнем углу; у пункта с подпунктами открывает список вверх
const DockItem = ({ item }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const Icon = NAV_ICONS[item.name] ?? Circle;
  const children = (item.children ?? [])
    .filter((c) => c.permissions?.view)
    .sort((a, b) => a.sort_order - b.sort_order);
  const hasChildren = children.length > 0;

  const isActivePath = (path) =>
    !!matchPath({ path, end: false }, location.pathname);
  const isActive =
    isActivePath(item.path) || children.some((c) => isActivePath(c.path));

  // Закрываем список при смене страницы и клике вне
  useEffect(() => setOpen(false), [location.pathname]);
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

  const cls = `${styles.fab} ${isActive ? styles.fabActive : ""} ${open ? styles.fabOpen : ""}`;
  const label = t(item.name);

  return (
    <div className={styles.dockItem} ref={ref}>
      {hasChildren ? (
        <button
          type="button"
          className={cls}
          aria-label={label}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon size={22} />
        </button>
      ) : (
        <NavLink to={item.path} className={cls} aria-label={label}>
          <Icon size={22} />
        </NavLink>
      )}
      {!open && <span className={styles.tip}>{label}</span>}

      {open && (
        <ul className={styles.menu}>
          <li className={styles.menuTitle}>{label}</li>
          {children.map((child) => (
            <li key={child.id}>
              <NavLink
                to={child.path}
                className={`${styles.menuLink} ${isActivePath(child.path) ? styles.menuLinkActive : ""}`}
              >
                {t(child.name)}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Кнопка переключения темы рядом с профилем (внизу слева)
const ThemeToggle = () => {
  const { t } = useTranslation();
  const theme = useAuthStore((s) => s.userSettings.theme);
  const setUserSettings = useAuthStore((s) => s.setUserSettings);
  const isDark = theme === "dark";

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setUserSettings({ theme: next });
    // сохраняем выбор в профиле; при ошибке тема всё равно применена локально
    updateProfile({ theme: next }).catch(() => {});
  };

  const label = isDark ? t("themeLight") : t("themeDark");

  return (
    <div className={`${styles.dockItem} ${styles.themeDock}`}>
      <button
        type="button"
        className={styles.fab}
        aria-label={label}
        onClick={toggle}
      >
        {isDark ? <Sun size={22} /> : <Moon size={22} />}
      </button>
      <span className={styles.tip}>{label}</span>
    </div>
  );
};

const TopNav = ({ menuData }) => {
  // «Главная» отдельным пунктом не выводим: у неё своя кнопка (showHome) и пункт в меню профиля
  const items = menuData
    .filter((m) => m.permissions?.view && m.name !== "home")
    .sort((a, b) => a.sort_order - b.sort_order);

  const { t } = useTranslation();
  const { pathname } = useLocation();
  // Кнопка выхода на главную — на всех страницах, кроме самой главной
  const showHome = pathname !== "/home";

  // Внутри списка парковок нижние кнопки скрыты: выход — стрелка «←» в баннере
  if (pathname.startsWith("/home/location")) return null;

  return (
    <>
      <Profile type="dock" />
      <ThemeToggle />

      {(showHome || items.length > 0) && (
        <nav className={styles.dock}>
          {showHome && (
            <div className={styles.dockItem}>
              <NavLink
                to="/home"
                className={styles.fab}
                aria-label={t("home")}
              >
                <LayoutDashboard size={22} />
              </NavLink>
              <span className={styles.tip}>{t("home")}</span>
            </div>
          )}
          {items.map((item) => (
            <DockItem key={item.id} item={item} />
          ))}
        </nav>
      )}
    </>
  );
};

export default TopNav;
