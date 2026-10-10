import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import styles from "./PageHero.module.scss";

// Шапка страницы в стиле главной: градиент с кругами, иконка и заголовок
const PageHero = ({ icon: Icon, title, subtitle, center, hideBack, children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // «Назад» везде, кроме главной; без истории (прямая ссылка) — на главную
  const showBack = !/^\/(home)?\/?$/.test(pathname) && !hideBack;
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/home");
  };

  return (
    <div className={styles.hero}>
      {showBack && (
        <button
          type="button"
          className={styles.heroBack}
          onClick={goBack}
          title={t("back")}
          aria-label={t("back")}
        >
          <ArrowLeft size={18} />
        </button>
      )}
      {Icon && (
        <div className={styles.heroIcon}>
          <Icon size={22} strokeWidth={2} />
        </div>
      )}
      <div className={styles.heroText}>
        <div className={styles.heroCrumb}>{subtitle ?? t("settings")}</div>
        <h1 className={styles.heroTitle}>{title}</h1>
      </div>
      {center && <div className={styles.heroCenter}>{center}</div>}
      {children && (
        <div className={styles.heroRight}>
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHero;
