import type { InputHTMLAttributes, ReactNode } from "react";
import { FieldError } from "../FieldError/FieldError";
import styles from "./Input.module.scss";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
};

export function Input({ className = "", error, hint, label, ...props }: InputProps) {
  return (
    <label className={[styles.field, className].join(" ").trim()}>
      {label && <span className={styles.label}>{label}</span>}
      <input
        className={[styles.input, error ? styles.invalid : ""].join(" ").trim()}
        {...props}
      />
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      <FieldError>{error}</FieldError>
    </label>
  );
}
