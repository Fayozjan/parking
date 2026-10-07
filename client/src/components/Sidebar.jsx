import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import SidebarItem from "./SidebarItem";
import Profile from "./Profile";
import { Icons } from "../icons/icons";

import styles from "./Sidebar.module.scss";

const Sidebar = ({ menuData }) => {
  const userSettings = useAuthStore((state) => state.userSettings);
  const access = useAuthStore((state) => state.access);
  const setSidebarState = useAuthStore((state) => state.setSidebarState);
  const setActiveBranch = useAuthStore((s) => s.setActiveBranch);

  const { sidebar: isOpen, viewMode, activeBranchId } = userSettings;
  const branches = access?.branches ?? [];
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  const [openItems, setOpenItems] = useState({});

  const location = useLocation();

  const toggleSidebar = () => setSidebarState(!isOpen);

  const toggleItem = useCallback((id) => {
    setOpenItems((prev) => {
      if (prev[id]) {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      }
      return { [id]: true };
    });
  }, []);

  useEffect(() => {
    const newOpenItems = {};

    const checkNode = (items) => {
      let isAnyChildActive = false;

      items.forEach((item) => {
        const hasChildren = item.children?.length > 0;
        // Элемент активен, если путь совпадает или это префикс (для вложенности)
        const isCurrentActive = location.pathname.startsWith(item.path);

        if (hasChildren) {
          const isChildActive = checkNode(item.children);
          if (isChildActive || isCurrentActive) {
            newOpenItems[item.id] = true;
            isAnyChildActive = true;
          }
        } else if (isCurrentActive) {
          isAnyChildActive = true;
        }
      });

      return isAnyChildActive;
    };

    checkNode(menuData);
    setOpenItems(newOpenItems);
  }, [location.pathname, menuData]);

  const renderedMenuItems = useMemo(() => {
    return menuData
      .filter((item) => item.permissions?.view)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          type={isOpen ? "full" : "mini"}
          toggleItem={toggleItem}
          isSubItemOpen={!!openItems[item.id]}
          openItems={openItems}
        />
      ));
  }, [menuData, isOpen, openItems, location.pathname, toggleItem]);

  return (
    <>
      <div
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
      >
        <div className={styles.sidebarTop}>
          {isOpen && (
            <Link to="/home" className={styles.logoWrapper}>
              <img src="/logo.png" alt="" className={styles.logo} />
              <span>OnBase</span>
            </Link>
          )}

          <span className={styles.toggle} onClick={toggleSidebar}>
            {Icons.sidebarToggle}
          </span>
        </div>

        <ul className={styles.menuWrapper}>{renderedMenuItems}</ul>

        {isOpen && (<span className={styles.version}>v{__APP_VERSION__}</span>)}

        {<Profile type={!isOpen && "mini"} />}
      </div>
    </>
  );
};

export default Sidebar;
