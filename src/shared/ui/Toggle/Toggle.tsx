import type { ReactNode } from "react";
import styles from "./Toggle.module.scss";

type ToggleProps = {
  checked: boolean;
  disabled?: boolean;
  label: ReactNode;
  onChange: (checked: boolean) => void;
};

export function Toggle({ checked, disabled = false, label, onChange }: ToggleProps) {
  return (
    <label className={styles.toggle}>
      <button
        aria-pressed={checked}
        className={[styles.control, checked ? styles.checked : ""].join(" ").trim()}
        disabled={disabled}
        type="button"
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
      <span className={styles.label}>{label}</span>
    </label>
  );
}
