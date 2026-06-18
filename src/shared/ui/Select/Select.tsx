import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { FieldError } from "../FieldError/FieldError";
import { Icon } from "../Icon/Icon";
import styles from "./Select.module.scss";

export type SelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

type SelectProps<TValue extends string = string> = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value"
> & {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
  onChange?: (value: TValue) => void;
  options: Array<SelectOption<TValue>>;
  placementStrategy?: "auto" | "bottom";
  placeholder?: string;
  value?: TValue;
};

export function Select<TValue extends string = string>({
  className = "",
  disabled = false,
  error,
  hint,
  label,
  onChange,
  options,
  placementStrategy = "auto",
  placeholder = "Выберите значение",
  value,
  ...props
}: SelectProps<TValue>) {
  const [isOpen, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleDocumentMouseDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !rootRef.current || !popoverRef.current) {
      return;
    }

    if (placementStrategy === "bottom") {
      setPlacement("bottom");
      return;
    }

    const gap = 8;
    const rootRect = rootRef.current.getBoundingClientRect();
    const popoverHeight = popoverRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - rootRect.bottom - gap;
    const spaceAbove = rootRect.top - gap;

    setPlacement(
      popoverHeight > spaceBelow && spaceAbove > spaceBelow ? "top" : "bottom"
    );
  }, [isOpen, options.length, placementStrategy]);

  function handleOptionClick(nextValue: TValue) {
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div className={[styles.field, className].join(" ").trim()} ref={rootRef}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        aria-expanded={isOpen}
        className={[styles.selectButton, error ? styles.invalid : ""]
          .join(" ")
          .trim()}
        disabled={disabled}
        type="button"
        onClick={() => setOpen((currentValue) => !currentValue)}
        {...props}
      >
        <span className={selectedOption ? styles.value : styles.placeholder}>
          {selectedOption?.label || placeholder}
        </span>
        <Icon name={isOpen ? "chevron-up" : "chevron-down"} />
      </button>

      {isOpen && (
        <div
          className={[styles.popover, styles[placement]].join(" ")}
          ref={popoverRef}
        >
          <div className={styles.options} role="listbox">
            {options.map((option) => {
              const isActive = String(option.value) === String(value);

              return (
                <button
                  aria-selected={isActive}
                  className={[
                    styles.option,
                    isActive ? styles.activeOption : "",
                  ]
                    .join(" ")
                    .trim()}
                  key={option.value}
                  role="option"
                  title={option.label}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hint && !error && <span className={styles.hint}>{hint}</span>}
      <FieldError>{error}</FieldError>
    </div>
  );
}
