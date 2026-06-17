import type { ReactNode, SelectHTMLAttributes } from "react";
import { FieldError } from "../FieldError/FieldError";
import styles from "./Select.module.scss";

export type SelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

type SelectProps<TValue extends string = string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value"
> & {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
  onChange?: (value: TValue) => void;
  options: Array<SelectOption<TValue>>;
  placeholder?: string;
  value?: TValue;
};

export function Select<TValue extends string = string>({
  className = "",
  error,
  hint,
  label,
  onChange,
  options,
  placeholder,
  value,
  ...props
}: SelectProps<TValue>) {
  return (
    <label className={[styles.field, className].join(" ").trim()}>
      {label && <span className={styles.label}>{label}</span>}
      <select
        className={[styles.select, error ? styles.invalid : ""].join(" ").trim()}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value as TValue)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      <FieldError>{error}</FieldError>
    </label>
  );
}
