import { useTranslation } from "react-i18next";
import styles from "./PageHero.module.scss";

// Шапка страницы в стиле главной: градиент с кругами, иконка и заголовок
const PageHero = ({ icon: Icon, title, subtitle, children }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.hero}>
      {Icon && (
        <div className={styles.heroIcon}>
          <Icon size={22} strokeWidth={2} />
        </div>
      )}
      <div className={styles.heroText}>
        <div className={styles.heroCrumb}>{subtitle ?? t("settings")}</div>
        <h1 className={styles.heroTitle}>{title}</h1>
      </div>
      {children && <div className={styles.heroRight}>{children}</div>}
    </div>
  );
};

export default PageHero;
