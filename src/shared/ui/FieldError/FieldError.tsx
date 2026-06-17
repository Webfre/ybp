import type { ReactNode } from "react";
import styles from "./FieldError.module.scss";

type FieldErrorProps = {
  children?: ReactNode;
};

export function FieldError({ children }: FieldErrorProps) {
  if (!children) {
    return null;
  }

  return <p className={styles.fieldError}>{children}</p>;
}
