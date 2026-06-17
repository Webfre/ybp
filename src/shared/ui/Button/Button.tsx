import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: IconName;
  isLoading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  disabled,
  icon,
  isLoading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[styles.button, styles[variant], className].join(" ").trim()}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? (
        <span aria-hidden="true" className={styles.spinner} />
      ) : (
        icon && <Icon className={styles.icon} name={icon} />
      )}
      <span>{children}</span>
    </button>
  );
}
