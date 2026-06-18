import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetCatalogsQuery } from "../../shared/api";
import { Badge, EmptyState, Pagination, Table, type TableColumn } from "../../shared/ui";
import type { Catalog } from "../../entities/catalog/model/types";
import styles from "./CatalogsListPage.module.scss";

export function CatalogsListPage() {
  const navigate = useNavigate();
  const { data: catalogs = [], isLoading } = useGetCatalogsQuery();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedCatalogs = useMemo(() => {
    const startIndex = (page - 1) * pageSize;

    return catalogs.slice(startIndex, startIndex + pageSize);
  }, [catalogs, page, pageSize]);

  const columns: Array<TableColumn<Catalog>> = [
    {
      key: "code",
      render: (catalog) => (
        <button
          className={styles.codeButton}
          type="button"
          onClick={() => navigate(`/catalogs/${catalog.id}`)}
        >
          {catalog.code}
        </button>
      ),
      title: "Код",
      width: "180px",
    },
    {
      key: "name",
      render: (catalog) => catalog.name,
      title: "Наименование",
    },
    {
      key: "attributes",
      render: (catalog) => catalog.attributes.length,
      title: "Атрибуты",
      width: "120px",
    },
    {
      key: "elements",
      render: (catalog) => catalog.elements.length,
      title: "Элементы",
      width: "120px",
    },
    {
      key: "settings",
      render: (catalog) => (
        <div className={styles.badges}>
          {catalog.hierarchyEnabled && <Badge tone="accent">Иерархия</Badge>}
          {catalog.versioningEnabled && <Badge tone="warning">Версионность</Badge>}
          {!catalog.hierarchyEnabled && !catalog.versioningEnabled && (
            <Badge>Базовый</Badge>
          )}
        </div>
      ),
      title: "Настройки",
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Контекст FE-001</span>
          <h1>Справочники</h1>
          <p>
            Минимальный экран нужен, чтобы дескрипторы типа Справочник могли
            выбирать целевой источник допустимых значений.
          </p>
        </div>
      </header>

      <section className={styles.surface}>
        {isLoading ? (
          <EmptyState title="Загружаем справочники" />
        ) : (
          <Table
            columns={columns}
            getRowKey={(catalog) => catalog.id}
            rows={paginatedCatalogs}
          />
        )}
        {!isLoading && catalogs.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            totalCount={catalogs.length}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
          />
        )}
      </section>
    </main>
  );
}
