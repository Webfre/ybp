import { useEffect, useRef, useState } from "react";
import { Button } from "../Button/Button";
import { FilterSelect } from "../FilterSelect/FilterSelect";
import styles from "./Pagination.module.scss";

type ScrollOnChange = "none" | "top" | "bottom";

type PaginationProps = {
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  scrollBehavior?: ScrollBehavior;
  scrollOnChange?: ScrollOnChange;
  totalCount: number;
};

export function Pagination({
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions = [],
  scrollBehavior = "smooth",
  scrollOnChange = "none",
  totalCount,
}: PaginationProps) {
  const safePageSize = Number(pageSize) || 1;
  const animationFrameRef = useRef<number | null>(null);
  const [isScrollPending, setScrollPending] = useState(false);
  const isInteractionDisabled = isLoading || isScrollPending;
  const safeTotalCount = Number(totalCount) || 0;
  const totalPages = Math.max(1, Math.ceil(safeTotalCount / safePageSize));
  const normalizedPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const shownCount =
    safeTotalCount > 0
      ? Math.min(
          safePageSize,
          safeTotalCount - (normalizedPage - 1) * safePageSize,
        )
      : 0;
  const hasPrevious = normalizedPage > 1;
  const hasNext = normalizedPage < totalPages;
  const summary =
    safeTotalCount > 0
      ? `Показано ${shownCount} из ${safeTotalCount}`
      : "Показано 0 из 0";

  const pageSizeSelectOptions = pageSizeOptions.map((option) => ({
    label: String(option),
    value: option,
  }));

  function getScrollTarget() {
    if (scrollOnChange === "bottom") {
      return document.documentElement.scrollHeight;
    }

    return 0;
  }

  function scrollAfterChange() {
    if (scrollOnChange === "none" || typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: getScrollTarget(),
        behavior: scrollBehavior,
      });
    });
  }

  function smoothScrollBeforeChange(callback: () => void) {
    if (
      scrollOnChange !== "top" ||
      scrollBehavior !== "smooth" ||
      typeof window === "undefined"
    ) {
      callback();
      scrollAfterChange();
      return;
    }

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    const startTop = window.scrollY || document.documentElement.scrollTop || 0;
    const targetTop = 0;
    const distance = targetTop - startTop;
    const durationMs = 360;
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!distance || prefersReducedMotion) {
      window.scrollTo({ top: targetTop });
      callback();
      return;
    }

    setScrollPending(true);

    const startTime = window.performance.now();
    const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

    function animateScroll(currentTime: number) {
      const progress = Math.min((currentTime - startTime) / durationMs, 1);
      const nextTop = startTop + distance * easeOutCubic(progress);

      window.scrollTo({ top: nextTop });

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animateScroll);
        return;
      }

      animationFrameRef.current = null;
      setScrollPending(false);
      callback();
    }

    animationFrameRef.current = window.requestAnimationFrame(animateScroll);
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (scrollOnChange !== "bottom" || isLoading) {
      return;
    }

    scrollAfterChange();
  }, [isLoading, page, pageSize, scrollOnChange]);

  function handlePageChange(nextPage: number) {
    smoothScrollBeforeChange(() => onPageChange?.(nextPage));
  }

  function handlePageSizeChange(nextPageSize: number) {
    smoothScrollBeforeChange(() => onPageSizeChange?.(Number(nextPageSize)));
  }

  return (
    <div className={styles.pagination}>
      <FilterSelect
        className={styles.pageSizeSelect}
        disabled={isInteractionDisabled}
        label="На странице"
        options={pageSizeSelectOptions}
        value={safePageSize}
        onChange={handlePageSizeChange}
      />

      <span className={styles.summary}>{summary}</span>

      <div className={styles.controls}>
        <Button
          disabled={!hasPrevious || isInteractionDisabled}
          variant="secondary"
          onClick={() => handlePageChange(normalizedPage - 1)}
        >
          Назад
        </Button>

        <span className={styles.page}>
          Страница {normalizedPage} из {totalPages}
        </span>

        <Button
          disabled={!hasNext || isInteractionDisabled}
          variant={hasNext && !isInteractionDisabled ? "primary" : "secondary"}
          onClick={() => handlePageChange(normalizedPage + 1)}
        >
          Вперед
        </Button>
      </div>
    </div>
  );
}
