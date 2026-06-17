import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
  action?: ReactNode;
  description?: string;
  icon?: IconName;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon = "info",
  title,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <Icon name={icon} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
