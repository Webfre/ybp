import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { APP_CONFIG } from "../../config";
import { IconButton } from "../IconButton/IconButton";
import styles from "./Modal.module.scss";

type ModalProps = {
  children: ReactNode;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

type ModalContent = Pick<ModalProps, "children" | "footer" | "title">;

export function Modal({ children, footer, isOpen, onClose, title }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const lastOpenContentRef = useRef<ModalContent>({ children, footer, title });

  if (isOpen) {
    lastOpenContentRef.current = { children, footer, title };
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return undefined;
    }

    if (!shouldRender) {
      return undefined;
    }

    setIsClosing(true);
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, APP_CONFIG.modal.closeAnimationDurationMs);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, shouldRender]);

  if (!shouldRender || typeof document === "undefined") {
    return null;
  }

  const {
    children: visibleChildren,
    footer: visibleFooter,
    title: visibleTitle,
  } = isOpen ? { children, footer, title } : lastOpenContentRef.current;

  const modal = (
    <div
      className={[styles.modal, isClosing ? styles.closing : ""].join(" ").trim()}
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-label={visibleTitle}
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2>{visibleTitle}</h2>
          <IconButton
            ariaLabel="Закрыть окно"
            icon="remove"
            onClick={onClose}
          />
        </header>
        <div className={styles.body}>{visibleChildren}</div>
        {visibleFooter && <footer className={styles.footer}>{visibleFooter}</footer>}
      </section>
    </div>
  );

  return createPortal(modal, document.body);
}
