import type { ReactNode } from "react";
import styles from "./Table.module.scss";

export type TableColumn<TRow> = {
  align?: "left" | "center" | "right";
  key: string;
  render: (row: TRow) => ReactNode;
  title: ReactNode;
  width?: string;
};

type TableProps<TRow> = {
  columns: Array<TableColumn<TRow>>;
  emptyText?: string;
  getRowKey: (row: TRow) => string;
  rows: TRow[];
};

export function Table<TRow>({
  columns,
  emptyText = "Нет данных",
  getRowKey,
  rows,
}: TableProps<TRow>) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={styles[column.align ?? "left"]}
                key={column.key}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td className={styles[column.align ?? "left"]} key={column.key}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className={styles.empty} colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
