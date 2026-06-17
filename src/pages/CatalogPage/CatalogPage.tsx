import { useNavigate, useParams } from "react-router-dom";
import { useGetCatalogQuery } from "../../shared/api";
import { Badge, Button, EmptyState, Icon, Table, type TableColumn } from "../../shared/ui";
import type { CatalogAttribute, CatalogElement, CatalogUsage } from "../../entities/catalog/model/types";
import styles from "./CatalogPage.module.scss";

const attributeTypeLabels: Record<CatalogAttribute["type"], string> = {
  boolean: "Логический",
  catalog: "Справочник",
  datetime: "Дата и время",
  number: "Число",
  string: "Строка",
};

export function CatalogPage() {
  const navigate = useNavigate();
  const { catalogId = "" } = useParams();
  const { data: catalog, isLoading } = useGetCatalogQuery(catalogId);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <EmptyState title="Загружаем паспорт справочника" />
      </main>
    );
  }

  if (!catalog) {
    return (
      <main className={styles.page}>
        <EmptyState
          action={<Button onClick={() => navigate("/catalogs")}>К списку</Button>}
          title="Справочник не найден"
        />
      </main>
    );
  }

  const attributeColumns: Array<TableColumn<CatalogAttribute>> = [
    { key: "code", render: (attribute) => attribute.code, title: "Код", width: "160px" },
    { key: "name", render: (attribute) => attribute.name, title: "Наименование" },
    {
      key: "type",
      render: (attribute) => attributeTypeLabels[attribute.type],
      title: "Тип",
      width: "160px",
    },
    {
      key: "required",
      render: (attribute) =>
        attribute.isRequired ? <Badge tone="warning">Обязательный</Badge> : <Badge>Нет</Badge>,
      title: "Обязательность",
      width: "160px",
    },
  ];

  const elementColumns: Array<TableColumn<CatalogElement>> = catalog.attributes.map(
    (attribute) => ({
      key: attribute.code,
      render: (element) => String(element.values[attribute.code] ?? "—"),
      title: attribute.name,
    }),
  );

  const usageColumns: Array<TableColumn<CatalogUsage>> = [
    {
      key: "kind",
      render: (usage) =>
        usage.kind === "descriptor" ? "Дескриптор" : "Атрибут справочника",
      title: "Тип связи",
      width: "180px",
    },
    { key: "code", render: (usage) => usage.code, title: "Код", width: "160px" },
    { key: "name", render: (usage) => usage.name, title: "Наименование" },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <button className={styles.backButton} type="button" onClick={() => navigate("/catalogs")}>
            <Icon name="chevron-left" />
            К списку
          </button>
          <h1>{catalog.name}</h1>
          <p>
            Паспорт справочника показан как поддерживающий контекст для дескрипторов
            ссылочного типа.
          </p>
        </div>
      </header>

      <section className={styles.summary}>
        <Badge tone="accent">{catalog.code}</Badge>
        <span>Шаблон отображения: {catalog.displayTemplate}</span>
        {catalog.hierarchyEnabled && <Badge tone="accent">Иерархия</Badge>}
        {catalog.versioningEnabled && <Badge tone="warning">Версионность</Badge>}
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Атрибуты</h2>
          <Table
            columns={attributeColumns}
            getRowKey={(attribute) => attribute.id}
            rows={catalog.attributes}
          />
        </article>
        <article className={styles.card}>
          <h2>Элементы</h2>
          <Table
            columns={elementColumns}
            getRowKey={(element) => element.id}
            rows={catalog.elements}
          />
        </article>
        <article className={styles.card}>
          <h2>Использование</h2>
          <Table
            columns={usageColumns}
            emptyText="Справочник пока не используется"
            getRowKey={(usage) => usage.id}
            rows={catalog.usages}
          />
        </article>
      </section>
    </main>
  );
}
