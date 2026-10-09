import { useEffect, useState } from "react";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icons } from "../icons/icons";

import { useAuthCheck } from "../hooks/useAuthCheck";
import { useAuthStore } from "../stores/authStore";

import { getUserMenu } from "../api";

import TopNav from "../components/TopNav";
import Loading from "../components/Loading";

import styles from "./WebLayout.module.scss";

export default function WebLayout() {
  const { getUserSettings } = useAuthStore();
  const location = useLocation();

  if (window.Telegram?.WebApp?.initData) {
    return <Navigate to="/tg" replace />;
  }
  const outlet = useOutlet();
  const [menuData, setMenuData] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const { theme: storedTheme, fontSize: storedFontSize } = getUserSettings();
  const { loading, isAuth } = useAuthCheck();
  const { userSettings } = useAuthStore();
  const language = userSettings.language;
  const { i18n, t } = useTranslation();

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const currentMenu = useMemo(() => {
    if (!menuData || !location?.pathname) return {};

    let foundMenu = null;
    let foundSubmenu = null;

    for (const menu of menuData) {
      if (menu.path === location.pathname) {
        foundMenu = menu;
        break;
      }
      if (menu.children?.length) {
        const sub = menu.children.find((child) =>
          location.pathname.startsWith(child.path),
        );
        if (sub) {
          foundMenu = menu;
          foundSubmenu = sub;
          break;
        }
      }
    }

    return { foundMenu, foundSubmenu };
  }, [menuData, location.pathname]);

  useEffect(() => {
    const fetchUserMenu = async () => {
      try {
        const res = await getUserMenu({ force: true });
        setMenuData(res);
      } catch (error) {
        console.error("Ошибка получения меню:", error);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchUserMenu();

    const handleVisibility = () => {
      if (!document.hidden) fetchUserMenu();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (storedTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [storedTheme]);

  useEffect(() => {
    const scaleMap = { small: 0.85, medium: 1, large: 1.15, xlarge: 1.3 };
    const scale = scaleMap[storedFontSize] ?? 1;
    document.documentElement.style.setProperty("--font-scale", scale);
  }, [storedFontSize]);

  // Если доступно ровно одно меню без подменю — сайдбар не нужен,
  // показываем только это меню
  const singleMenu = useMemo(() => {
    const visible = menuData.filter((m) => m.permissions?.view);
    if (visible.length !== 1) return null;

    const menu = visible[0];
    const visibleChildren = (menu.children ?? []).filter(
      (c) => c.permissions?.view,
    );

    return visibleChildren.length ? null : menu;
  }, [menuData]);

  const isAllowedPath = useMemo(() => {
    if (menuLoading || !menuData.length) return true;
    const pathname = location.pathname;
    if (pathname === "/home" || pathname.startsWith("/home/")) return true;
    for (const menu of menuData) {
      if (menu.path === pathname) return !!menu.permissions?.view;
      if (menu.children?.length) {
        const child = menu.children.find((child) =>
          pathname.startsWith(child.path),
        );
        if (child) return !!child.permissions?.view;
      }
    }
    return false;
  }, [menuLoading, menuData, location.pathname]);

  if (loading || menuLoading) {
    return <Loading />;
  }

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  if (
    singleMenu &&
    location.pathname !== singleMenu.path &&
    !location.pathname.startsWith(`${singleMenu.path}/`)
  ) {
    return <Navigate to={singleMenu.path} replace />;
  }

  if (!isAllowedPath) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className={`${styles.layout} ${styles.layoutSolo}`}>
      <TopNav menuData={menuData} />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.1 } }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.1 } }}
          className={styles.page}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
