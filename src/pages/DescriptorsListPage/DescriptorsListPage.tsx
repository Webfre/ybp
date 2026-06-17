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
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  Select,
  Table,
  type TableColumn,
} from "../../shared/ui";
import styles from "./DescriptorsListPage.module.scss";

const allOption = { label: "Все", value: "all" };

function getStatusBadge(descriptor: Descriptor) {
  if (descriptor.status === "error") {
    return <Badge tone="danger">Ошибка</Badge>;
  }

  if (descriptor.status === "warning") {
    return <Badge tone="warning">Есть замечания</Badge>;
  }

  return <Badge tone="success">Валиден</Badge>;
}

export function DescriptorsListPage() {
  const navigate = useNavigate();
  const { data: descriptors = [], isLoading } = useGetDescriptorsQuery();
  const [search, setSearch] = useState("");
  const [dataType, setDataType] = useState("all");
  const [usage, setUsage] = useState("all");

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
        descriptor.formula ? <Badge tone="accent">Есть формула</Badge> : "—",
      title: "Формула",
      width: "140px",
    },
    {
      key: "status",
      render: getStatusBadge,
      title: "Статус",
      width: "150px",
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
            и демонстрационные статусы валидации.
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
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Тип данных"
          options={[allOption, ...descriptorDataTypeOptions]}
          value={dataType}
          onChange={setDataType}
        />
        <Select
          label="Способ использования"
          options={[allOption, ...descriptorUsageOptions]}
          value={usage}
          onChange={setUsage}
        />
        <Button
          icon="refresh"
          variant="secondary"
          onClick={() => {
            setSearch("");
            setDataType("all");
            setUsage("all");
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
            rows={filteredDescriptors}
          />
        )}
      </section>
    </main>
  );
}
