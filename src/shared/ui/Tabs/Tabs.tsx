import type { ReactNode } from "react";
import styles from "./Tabs.module.scss";

export type TabItem<TValue extends string = string> = {
  badge?: ReactNode;
  label: string;
  value: TValue;
};

type TabsProps<TValue extends string = string> = {
  items: Array<TabItem<TValue>>;
  onChange: (value: TValue) => void;
  value: TValue;
};

export function Tabs<TValue extends string = string>({
  items,
  onChange,
  value,
}: TabsProps<TValue>) {
  return (
    <div className={styles.tabs} role="tablist">
      {items.map((item) => {
        const isActive = item.value === value;

        return (
          <button
            aria-selected={isActive}
            className={[styles.tab, isActive ? styles.active : ""]
              .join(" ")
              .trim()}
            key={item.value}
            role="tab"
            type="button"
            onClick={() => onChange(item.value)}
          >
            <span>{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
