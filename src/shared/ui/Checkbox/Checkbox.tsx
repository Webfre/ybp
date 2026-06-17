import type { ChangeEvent, ReactNode } from "react";
import styles from "./Checkbox.module.scss";

type CheckboxProps = {
  checked?: boolean;
  className?: string;
  disabled?: boolean;
  label: ReactNode;
  name?: string;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
};

export function Checkbox({
  checked = false,
  className = "",
  disabled = false,
  label,
  name,
  onChange,
}: CheckboxProps) {
  return (
    <label className={[styles.checkbox, className].join(" ").trim()}>
      <input
        checked={checked}
        disabled={disabled}
        name={name}
        type="checkbox"
        onChange={(event) => onChange?.(event.target.checked, event)}
      />
      <span className={styles.box} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </label>
  );
}
