import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../../shared/ui";
import styles from "./AppLayout.module.scss";

const navigation = [
  { icon: "dashboard", label: "Дашборд", to: "/" },
  { icon: "list", label: "Дескрипторы", to: "/descriptors" },
  { icon: "catalog", label: "Справочники", to: "/catalogs" },
  { icon: "history", label: "Периоды", to: "/periods" },
  { icon: "settings", label: "Настройки", to: "/settings" },
] as const;

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>ПУ</span>
          <div>
            <strong>ПроУБП</strong>
            <span>Хранилище показателей</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.active : ""].join(" ").trim()
              }
              end={item.to === "/"}
              key={item.to}
              to={item.to}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.search}>
            <Icon name="search" />
            <span>Поиск по системе...</span>
          </div>
          <div className={styles.profile}>
            <Icon name="user" />
            <span>Роман Мухаметшин</span>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
