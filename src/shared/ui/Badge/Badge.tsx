import type { ReactNode } from "react";
import styles from "./Badge.module.scss";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={[styles.badge, styles[tone]].join(" ")}>{children}</span>;
}
