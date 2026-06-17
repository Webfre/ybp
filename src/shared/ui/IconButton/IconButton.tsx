import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import styles from "./IconButton.module.scss";

export type IconButtonTone = "default" | "danger";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label"
> & {
  ariaLabel: string;
  icon: IconName;
  tone?: IconButtonTone;
};

export function IconButton({
  ariaLabel,
  className = "",
  icon,
  tone = "default",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={[styles.iconButton, styles[tone], className].join(" ").trim()}
      title={ariaLabel}
      type={type}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
