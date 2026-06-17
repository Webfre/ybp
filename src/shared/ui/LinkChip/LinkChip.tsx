import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import styles from "./LinkChip.module.scss";

type LinkChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName;
  name: string;
};

export function LinkChip({
  className = "",
  icon = "link",
  name,
  type = "button",
  ...props
}: LinkChipProps) {
  return (
    <button
      className={[styles.linkChip, className].join(" ").trim()}
      type={type}
      {...props}
    >
      <Icon name={icon} />
      <span>{name}</span>
    </button>
  );
}
