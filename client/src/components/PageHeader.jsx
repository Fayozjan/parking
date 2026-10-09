import styles from "./PageHeader.module.scss";

// Заголовок страницы: закреплён вверху страницы (sticky), не исчезает при прокрутке.
const PageHeader = ({ icon: Icon, title, subtitle, color = "#6366f1" }) => (
  <div className={styles.pageHeader}>
    <div className={styles.iconWrap} style={{ background: color + "14" }}>
      <Icon size={15} color={color} strokeWidth={2} />
    </div>
    <div className={styles.textBlock}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  </div>
);

export default PageHeader;
