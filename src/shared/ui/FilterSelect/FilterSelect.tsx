import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";
import { Icon } from "../Icon/Icon";
import styles from "./FilterSelect.module.scss";

export type FilterSelectValue = string | number;

export type FilterSelectOption<TValue extends FilterSelectValue> = {
  label: string;
  title?: string;
  value: TValue;
};

type FilterSelectProps<TValue extends FilterSelectValue> = {
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
  error?: string;
  hasMore?: boolean;
  isEmpty?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  label: string;
  loadingMessage?: string;
  loadingMoreMessage?: string;
  onChange: (value: TValue) => void;
  onLoadMore?: () => void;
  onSearchChange?: (value: string) => void;
  options: Array<FilterSelectOption<TValue>>;
  placeholder?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  shownCount?: number;
  totalCount?: number;
  value?: TValue;
};

function handleListScroll(event: UIEvent<HTMLDivElement>, onLoadMore?: () => void) {
  if (!onLoadMore) {
    return;
  }

  const listElement = event.currentTarget;
  const distanceToBottom =
    listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight;

  if (distanceToBottom <= 72) {
    onLoadMore();
  }
}

export function FilterSelect<TValue extends FilterSelectValue>({
  className = "",
  disabled = false,
  emptyMessage = "Ничего не найдено",
  error = "",
  hasMore = false,
  isEmpty,
  isLoading = false,
  isLoadingMore = false,
  label,
  loadingMessage = "Загружаем...",
  loadingMoreMessage = "Подгружаем...",
  onChange,
  onLoadMore,
  onSearchChange,
  options,
  placeholder = "Выберите значение",
  searchPlaceholder = "Поиск",
  searchValue = "",
  shownCount,
  totalCount,
  value,
}: FilterSelectProps<TValue>) {
  const [isOpen, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const popoverRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasSearch = Boolean(onSearchChange);
  const shouldShowEmptyState = isEmpty ?? options.length === 0;

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value],
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

    const gap = 8;
    const rootRect = rootRef.current.getBoundingClientRect();
    const popoverHeight = popoverRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - rootRect.bottom - gap;
    const spaceAbove = rootRect.top - gap;

    setPlacement(
      popoverHeight > spaceBelow && spaceAbove > spaceBelow ? "top" : "bottom",
    );
  }, [isOpen, options.length, hasSearch, isLoading, error]);

  return (
    <div className={[styles.filterSelect, className].join(" ").trim()} ref={rootRef}>
      <span className={styles.label}>{label}</span>

      <button
        className={styles.button}
        disabled={disabled}
        type="button"
        onClick={() => setOpen((currentValue) => !currentValue)}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <Icon name={isOpen ? "chevron-up" : "chevron-down"} />
      </button>

      {isOpen && (
        <div
          className={[styles.popover, styles[placement]].join(" ")}
          ref={popoverRef}
        >
          {hasSearch && (
            <label className={styles.search}>
              <Icon name="search" />
              <input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
              {searchValue && (
                <button type="button" onClick={() => onSearchChange?.("")}>
                  <Icon name="remove" />
                </button>
              )}
            </label>
          )}

          <div
            className={styles.list}
            onScroll={(event) => handleListScroll(event, onLoadMore)}
          >
            {isLoading && (
              <div className={styles.state}>
                <span className={styles.spinner} />
                {loadingMessage}
              </div>
            )}

            {!isLoading && error && (
              <div className={[styles.state, styles.error].join(" ")}>
                {error}
              </div>
            )}

            {!isLoading && !error && shouldShowEmptyState && (
              <div className={styles.state}>{emptyMessage}</div>
            )}

            {!error &&
              options.map((option) => {
                const isActive = String(option.value) === String(value);

                return (
                  <button
                    className={[
                      styles.option,
                      isActive ? styles.activeOption : "",
                    ]
                      .join(" ")
                      .trim()}
                    key={option.value}
                    title={option.title || option.label}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}

            {!isLoading && !error && isLoadingMore && (
              <div className={styles.state}>
                <span className={styles.spinner} />
                {loadingMoreMessage}
              </div>
            )}

            {!isLoading &&
              !error &&
              !hasMore &&
              Boolean(shownCount) &&
              typeof totalCount === "number" && (
                <div className={styles.state}>
                  Показано {shownCount} из {totalCount}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
