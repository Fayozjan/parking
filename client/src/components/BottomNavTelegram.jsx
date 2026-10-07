import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icons } from "../icons/icons";

import styles from "./BottomNavTelegram.module.scss";

const MENU_ITEMS = [
  { name: "home", path: "/tg/home", icon: "homeTelegram" },
  { name: "fixations", path: "/tg/vehicle-passes", icon: "vehicle-passes" },
  { name: "settings", path: "/tg/more", icon: "settings" },
];

export default function BottomNavTelegram() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const navRef = useRef(null);
  const itemRefs = useRef([]);

  const isActive = (item) => location.pathname.startsWith(item.path);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    const handleViewport = () => {
      setIsKeyboardOpen(tg.viewportStableHeight - tg.viewportHeight > 100);
    };
    tg.onEvent("viewportChanged", handleViewport);
    return () => tg.offEvent("viewportChanged", handleViewport);
  }, []);

  const handleNavClick = (item) => {
    if (isActive(item)) {
      const container = document.getElementById("scroll-container");
      container
        ? container.scrollTo({ top: 0, behavior: "smooth" })
        : window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(item.path);
    }
  };

  if (isKeyboardOpen) return null;

  const renderNavItem = (item, index) => {
    const Icon = Icons[item.icon] || Icons.default;
    const active = isActive(item);
    return (
      <button
        key={item.path}
        ref={(el) => (itemRefs.current[index] = el)}
        className={`${styles.navItem} ${active ? styles.active : ""}`}
        onClick={() => handleNavClick(item)}
      >
        <span className={styles.icon}>{Icon}</span>
        <span className={styles.label}>{t(item.name)}</span>
      </button>
    );
  };

  return (
    <nav className={styles.bottomNav} ref={navRef}>
      {MENU_ITEMS.map((item, i) => renderNavItem(item, i))}
    </nav>
  );
}
