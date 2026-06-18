import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  descriptorDataTypeLabels,
  descriptorDataTypeOptions,
  descriptorUsageLabels,
  descriptorUsageOptions,
} from "../../entities/descriptor/model/dictionaries";
import type { Descriptor } from "../../entities/descriptor/model/types";
import { useGetDescriptorsQuery } from "../../shared/api";
import {
  Button,
  EmptyState,
  IconButton,
  Input,
  Pagination,
  Select,
  Table,
  type TableColumn,
} from "../../shared/ui";
import styles from "./DescriptorsListPage.module.scss";

const allOption = { label: "Все", value: "all" };

export function DescriptorsListPage() {
  const navigate = useNavigate();
  const { data: descriptors = [], isLoading } = useGetDescriptorsQuery();
  const [search, setSearch] = useState("");
  const [dataType, setDataType] = useState("all");
  const [usage, setUsage] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredDescriptors = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ru-RU");

    return descriptors.filter((descriptor) => {
      const matchesSearch =
        !normalizedSearch ||
        descriptor.code.toLocaleLowerCase("ru-RU").includes(normalizedSearch) ||
        descriptor.name.toLocaleLowerCase("ru-RU").includes(normalizedSearch);
      const matchesDataType = dataType === "all" || descriptor.dataType === dataType;
      const matchesUsage = usage === "all" || descriptor.usage === usage;

      return matchesSearch && matchesDataType && matchesUsage;
    });
  }, [dataType, descriptors, search, usage]);

  const paginatedDescriptors = useMemo(() => {
    const startIndex = (page - 1) * pageSize;

    return filteredDescriptors.slice(startIndex, startIndex + pageSize);
  }, [filteredDescriptors, page, pageSize]);

  function resetPage() {
    setPage(1);
  }

  const columns: Array<TableColumn<Descriptor>> = [
    {
      key: "code",
      render: (descriptor) => (
        <button
          className={styles.codeButton}
          type="button"
          onClick={() => navigate(`/descriptors/${descriptor.id}`)}
        >
          {descriptor.code}
        </button>
      ),
      title: "Код",
      width: "150px",
    },
    {
      key: "name",
      render: (descriptor) => descriptor.name,
      title: "Наименование",
    },
    {
      key: "dataType",
      render: (descriptor) => descriptorDataTypeLabels[descriptor.dataType],
      title: "Тип данных",
      width: "150px",
    },
    {
      key: "usage",
      render: (descriptor) => descriptorUsageLabels[descriptor.usage],
      title: "Способ использования",
      width: "190px",
    },
    {
      key: "dimensions",
      render: (descriptor) => descriptor.analyticDimensions.length || "—",
      title: "Разрезы",
      width: "110px",
    },
    {
      key: "formula",
      render: (descriptor) =>
        descriptor.formula ? "Есть формула" : "—",
      title: "Формула",
      width: "140px",
    },
    {
      align: "right",
      key: "actions",
      render: (descriptor) => (
        <div className={styles.actions}>
          <IconButton
            ariaLabel="Редактировать"
            icon="edit"
            onClick={() => navigate(`/descriptors/${descriptor.id}`)}
          />
          <IconButton ariaLabel="Удалить" icon="trash" tone="danger" />
        </div>
      ),
      title: "Действия",
      width: "120px",
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>FE-001</span>
          <h1>Управление дескрипторами</h1>
          <p>
            Мок-экран покрывает список, поиск, фильтры, создание, редактирование
            и основные сценарии работы с дескрипторами.
          </p>
        </div>
        <Button icon="plus" onClick={() => navigate("/descriptors/new")}>
          Создать дескриптор
        </Button>
      </header>

      <section className={styles.toolbar}>
        <Input
          label="Поиск"
          placeholder="Код или наименование"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            resetPage();
          }}
        />
        <Select
          label="Тип данных"
          options={[allOption, ...descriptorDataTypeOptions]}
          value={dataType}
          onChange={(nextDataType) => {
            setDataType(nextDataType);
            resetPage();
          }}
        />
        <Select
          label="Способ использования"
          options={[allOption, ...descriptorUsageOptions]}
          value={usage}
          onChange={(nextUsage) => {
            setUsage(nextUsage);
            resetPage();
          }}
        />
        <Button
          icon="refresh"
          variant="secondary"
          onClick={() => {
            setSearch("");
            setDataType("all");
            setUsage("all");
            resetPage();
          }}
        >
          Сбросить
        </Button>
      </section>

      <section className={styles.surface}>
        {isLoading ? (
          <EmptyState description="Получаем мок-данные через RTK Query." title="Загружаем дескрипторы" />
        ) : (
          <Table
            columns={columns}
            emptyText="Дескрипторы не найдены"
            getRowKey={(descriptor) => descriptor.id}
            rows={paginatedDescriptors}
          />
        )}
        {!isLoading && filteredDescriptors.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            totalCount={filteredDescriptors.length}
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
