import { useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./PageHeader.module.scss";

// Слот в верхней панели (режим без сайдбара, см. WebLayout)
export const PAGE_HEADER_SLOT_ID = "pageHeaderSlot";

const PageHeader = ({ icon: Icon, title, subtitle, color = "#6366f1" }) => {
  const [slot, setSlot] = useState(null);

  // Если слот есть — заголовок рендерится в верхнюю панель, а не на странице
  useLayoutEffect(() => {
    setSlot(document.getElementById(PAGE_HEADER_SLOT_ID));
  }, []);

  const content = (
    <div className={`${styles.pageHeader} ${slot ? styles.inTopBar : ""}`}>
      <div className={styles.iconWrap} style={{ background: color + "14" }}>
        <Icon size={15} color={color} strokeWidth={2} />
      </div>
      <div className={styles.textBlock}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );

  return slot ? createPortal(content, slot) : content;
};

export default PageHeader;
