import type { ReactNode, TextareaHTMLAttributes } from "react";
import { FieldError } from "../FieldError/FieldError";
import styles from "./Textarea.module.scss";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
};

export function Textarea({
  className = "",
  error,
  hint,
  label,
  ...props
}: TextareaProps) {
  return (
    <label className={[styles.field, className].join(" ").trim()}>
      {label && <span className={styles.label}>{label}</span>}
      <textarea
        className={[styles.textarea, error ? styles.invalid : ""]
          .join(" ")
          .trim()}
        {...props}
      />
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      <FieldError>{error}</FieldError>
    </label>
  );
}
