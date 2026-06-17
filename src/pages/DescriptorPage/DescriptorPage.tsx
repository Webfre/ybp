import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  descriptorDataTypeLabels,
  descriptorDataTypeOptions,
  descriptorUsageLabels,
  descriptorUsageOptions,
  getDefaultUsageByDataType,
} from "../../entities/descriptor/model/dictionaries";
import type {
  AnalyticDimension,
  DescriptorDraft,
  DescriptorUsagePlace,
} from "../../entities/descriptor/model/types";
import { useGetCatalogsQuery, useGetDescriptorQuery, useGetDescriptorsQuery } from "../../shared/api";
import { validateDescriptorDraft, validateFormula, type ValidationIssue } from "../../shared/lib/validation";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  FieldError,
  Icon,
  IconButton,
  Input,
  LinkChip,
  Select,
  Table,
  Tabs,
  Textarea,
  Toggle,
  type TableColumn,
} from "../../shared/ui";
import styles from "./DescriptorPage.module.scss";

type DescriptorTab = "general" | "formula" | "dimensions" | "key" | "usage";

const tabItems = [
  { label: "Общее", value: "general" },
  { label: "Формула", value: "formula" },
  { label: "Разрезы", value: "dimensions" },
  { label: "Ключ и история", value: "key" },
  { label: "Использование", value: "usage" },
] satisfies Array<{ label: string; value: DescriptorTab }>;

const operators = ["+", "-", "*", "/", "(", ")", "="];

function createNewDescriptorDraft(): DescriptorDraft {
  return {
    analyticDimensions: [],
    code: "",
    dataType: "number",
    formula: "",
    formulaArguments: [{ descriptorId: "new", letter: "A" }],
    historyEnabled: false,
    id: "new",
    name: "",
    usage: "metric",
    useAllDimensionsOptional: false,
    usagePlaces: [],
  };
}

function getFieldIssue(issues: ValidationIssue[], field: string) {
  return issues.find((issue) => issue.field === field)?.message;
}

function getUsagePlaceLabel(place: DescriptorUsagePlace) {
  const labels: Record<DescriptorUsagePlace["kind"], string> = {
    catalog: "Справочник",
    dimension: "Аналитический разрез",
    form: "Форма",
    formula: "Формула",
    registry: "Реестр",
  };

  return labels[place.kind];
}

export function DescriptorPage() {
  const navigate = useNavigate();
  const { descriptorId = "new" } = useParams();
  const isNew = descriptorId === "new";
  const { data: descriptors = [] } = useGetDescriptorsQuery();
  const { data: catalogs = [] } = useGetCatalogsQuery();
  const { data: descriptor, isLoading } = useGetDescriptorQuery(descriptorId, {
    skip: isNew,
  });
  const [activeTab, setActiveTab] = useState<DescriptorTab>("general");
  const [formulaIssues, setFormulaIssues] = useState<ValidationIssue[]>([]);

  const initialDraft = useMemo(
    () => (isNew ? createNewDescriptorDraft() : descriptor),
    [descriptor, isNew],
  );

  const [draft, setDraft] = useState<DescriptorDraft | undefined>(initialDraft);

  useEffect(() => {
    if (!initialDraft) {
      return;
    }

    setDraft({
      ...initialDraft,
      usagePlaces: initialDraft.usagePlaces ?? [],
    });
  }, [initialDraft]);

  const actualDraft = draft ?? initialDraft;

  const validationIssues = useMemo(
    () => (actualDraft ? validateDescriptorDraft(actualDraft, descriptors) : []),
    [actualDraft, descriptors],
  );

  const dimensionDescriptors = descriptors.filter(
    (item) => item.usage === "dimension" || item.usage === "hybrid",
  );
  const metricDescriptors = descriptors.filter((item) => item.usage === "metric");
  const catalogOptions = catalogs.map((catalog) => ({
    label: `${catalog.code} / ${catalog.name}`,
    value: catalog.id,
  }));

  if (isLoading || !actualDraft) {
    return (
      <main className={styles.page}>
        <EmptyState title="Загружаем паспорт дескриптора" />
      </main>
    );
  }

  const currentDraft: DescriptorDraft = actualDraft;

  function updateDraft(patch: Partial<DescriptorDraft>) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return { ...currentDraft, ...patch };
    });
  }

  function handleDataTypeChange(nextDataType: DescriptorDraft["dataType"]) {
    const defaultUsage = getDefaultUsageByDataType(nextDataType);

    updateDraft({
      catalogId: nextDataType === "catalog" ? currentDraft.catalogId : undefined,
      dataType: nextDataType,
      usage: defaultUsage,
    });

    toast(`Способ использования установлен: ${descriptorUsageLabels[defaultUsage]}`);
  }

  function handleGenerateCode() {
    const nextCode = `DESC_${String(descriptors.length + 1).padStart(3, "0")}`;
    updateDraft({ code: nextCode });
    toast.success("Код дескриптора сгенерирован");
  }

  function handleSave() {
    const errors = validationIssues.filter((issue) => issue.tone === "error");

    if (errors.length) {
      toast.error("Паспорт содержит ошибки. Проверьте сводку валидации.");
      return;
    }

    toast.success(isNew ? "Дескриптор создан в мок-слое" : "Изменения сохранены в мок-слое");
  }

  function addDimension(descriptorIdToAdd: string) {
    if (!descriptorIdToAdd) {
      return;
    }

    const isDuplicate = currentDraft.analyticDimensions.some(
      (dimension) => dimension.descriptorId === descriptorIdToAdd,
    );

    if (isDuplicate) {
      toast("Разрез уже добавлен");
      return;
    }

    const candidate = descriptors.find((item) => item.id === descriptorIdToAdd);

    if (candidate?.usage === "metric") {
      toast.error("Показатель нельзя добавить как аналитический разрез");
      return;
    }

    updateDraft({
      analyticDimensions: [
        ...currentDraft.analyticDimensions,
        { descriptorId: descriptorIdToAdd, inKey: false, isRequired: true },
      ],
    });
  }

  function updateDimension(
    descriptorIdToUpdate: string,
    patch: Partial<AnalyticDimension>,
  ) {
    updateDraft({
      analyticDimensions: currentDraft.analyticDimensions.map((dimension) =>
        dimension.descriptorId === descriptorIdToUpdate
          ? { ...dimension, ...patch }
          : dimension,
      ),
    });
  }

  function removeDimension(descriptorIdToRemove: string) {
    updateDraft({
      analyticDimensions: currentDraft.analyticDimensions.filter(
        (dimension) => dimension.descriptorId !== descriptorIdToRemove,
      ),
    });
  }

  const dimensionColumns: Array<TableColumn<AnalyticDimension>> = [
    {
      key: "name",
      render: (dimension) => {
        const dimensionDescriptor = descriptors.find(
          (item) => item.id === dimension.descriptorId,
        );

        return dimensionDescriptor ? (
          <div className={styles.dimensionName}>
            <strong>{dimensionDescriptor.name}</strong>
            <span>{dimensionDescriptor.code}</span>
          </div>
        ) : (
          "Неизвестный разрез"
        );
      },
      title: "Разрез",
    },
    {
      key: "required",
      render: (dimension) => (
        <Checkbox
          checked={dimension.isRequired}
          label="Обязательный"
          onChange={(checked) =>
            updateDimension(dimension.descriptorId, {
              inKey: checked ? dimension.inKey : false,
              isRequired: checked,
            })
          }
        />
      ),
      title: "Обязательность",
      width: "190px",
    },
    {
      key: "key",
      render: (dimension) => (
        <Checkbox
          checked={dimension.inKey}
          disabled={!dimension.isRequired}
          label="В ключе"
          onChange={(checked) =>
            updateDimension(dimension.descriptorId, { inKey: checked })
          }
        />
      ),
      title: "Ключ",
      width: "140px",
    },
    {
      key: "restriction",
      render: (dimension) => dimension.restriction || "—",
      title: "Допустимые значения",
    },
    {
      align: "right",
      key: "actions",
      render: (dimension) => (
        <IconButton
          ariaLabel="Удалить разрез"
          icon="trash"
          tone="danger"
          onClick={() => removeDimension(dimension.descriptorId)}
        />
      ),
      title: "",
      width: "72px",
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <button className={styles.backButton} type="button" onClick={() => navigate("/descriptors")}>
            <Icon name="chevron-left" />
            К списку
          </button>
          <h1>{isNew ? "Создание дескриптора" : actualDraft.name}</h1>
          <p>
            Паспорт показывает зависимости FE-001: тип данных, способ использования,
            формулу, аналитические разрезы, составной ключ и использование.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate("/descriptors")}>
            Отмена
          </Button>
          <Button icon="save" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </header>

      <section className={styles.contentGrid}>
        <div className={styles.editor}>
          <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} />

          {activeTab === "general" && (
            <div className={styles.section}>
              <div className={styles.formGrid}>
                <Input
                  error={getFieldIssue(validationIssues, "code")}
                  hint="Если код пустой, его можно сгенерировать."
                  label="Уникальный код"
                  placeholder="DESC_001"
                  value={actualDraft.code}
                  onChange={(event) => updateDraft({ code: event.target.value })}
                />
                <div className={styles.inlineAction}>
                  <Button icon="refresh" variant="secondary" onClick={handleGenerateCode}>
                    Сгенерировать
                  </Button>
                </div>
                <Input
                  error={getFieldIssue(validationIssues, "name")}
                  label="Наименование"
                  placeholder="Например, Отклонение выпуска"
                  value={actualDraft.name}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                />
                <Select
                  label="Тип данных"
                  options={descriptorDataTypeOptions}
                  value={actualDraft.dataType}
                  onChange={handleDataTypeChange}
                />
                {actualDraft.dataType === "catalog" && (
                  <Select
                    error={getFieldIssue(validationIssues, "catalogId")}
                    label="Целевой справочник"
                    options={catalogOptions}
                    placeholder="Выберите справочник"
                    value={actualDraft.catalogId ?? ""}
                    onChange={(catalogId) => updateDraft({ catalogId })}
                  />
                )}
                <Select
                  label="Способ использования"
                  options={descriptorUsageOptions}
                  value={actualDraft.usage}
                  onChange={(usage) => updateDraft({ usage })}
                />
              </div>
            </div>
          )}

          {activeTab === "formula" && (
            <div className={styles.section}>
              <div className={styles.formulaLayout}>
                <aside className={styles.argumentPanel}>
                  <h2>Аргументы</h2>
                  {actualDraft.formulaArguments.map((argument) => {
                    const argumentDescriptor =
                      argument.descriptorId === actualDraft.id
                        ? actualDraft
                        : descriptors.find((item) => item.id === argument.descriptorId);

                    return (
                      <LinkChip
                        icon="link"
                        key={argument.letter}
                        name={`${argument.letter} - ${argumentDescriptor?.name ?? "Не выбран"}`}
                      />
                    );
                  })}
                  {metricDescriptors
                    .filter(
                      (item) =>
                        item.id !== actualDraft.id &&
                        !actualDraft.formulaArguments.some(
                          (argument) => argument.descriptorId === item.id,
                        ),
                    )
                    .slice(0, 3)
                    .map((item, index) => (
                      <button
                        className={styles.argumentButton}
                        key={item.id}
                        type="button"
                        onClick={() =>
                          updateDraft({
                            formulaArguments: [
                              ...actualDraft.formulaArguments,
                              { descriptorId: item.id, letter: String.fromCharCode(66 + index) },
                            ],
                          })
                        }
                      >
                        Добавить {item.name}
                      </button>
                    ))}
                </aside>

                <div className={styles.formulaEditor}>
                  <div className={styles.operatorBar}>
                    {operators.map((operator) => (
                      <button
                        key={operator}
                        type="button"
                        onClick={() =>
                          updateDraft({ formula: `${actualDraft.formula}${operator}` })
                        }
                      >
                        {operator}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    error={formulaIssues[0]?.message}
                    label="Формула вычисляемого показателя"
                    placeholder="A = B - C"
                    value={actualDraft.formula}
                    onChange={(event) => updateDraft({ formula: event.target.value })}
                  />
                  <div className={styles.formulaActions}>
                    <Button
                      icon="check"
                      variant="secondary"
                      onClick={() => {
                        const nextIssues = validateFormula(actualDraft.formula);
                        setFormulaIssues(nextIssues);
                        if (nextIssues.length) {
                          toast.error("Формула содержит ошибки");
                          return;
                        }
                        toast.success("Формула прошла мок-проверку");
                      }}
                    >
                      Проверить
                    </Button>
                    <span>Поддерживаются операторы +, -, *, /, скобки и комментарии #.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "dimensions" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Аналитические разрезы показателя</h2>
                  <p>Разрезы определяют допустимые координаты значения показателя.</p>
                </div>
                <Select
                  label="Добавить разрез"
                  options={dimensionDescriptors.map((item) => ({
                    label: `${item.code} / ${item.name}`,
                    value: item.id,
                  }))}
                  placeholder="Выберите"
                  onChange={addDimension}
                />
              </div>
              <Table
                columns={dimensionColumns}
                emptyText="Разрезы пока не добавлены"
                getRowKey={(dimension) => dimension.descriptorId}
                rows={actualDraft.analyticDimensions}
              />
              <div className={styles.toggleRow}>
                <Toggle
                  checked={actualDraft.useAllDimensionsOptional}
                  label="Использовать все возможные разрезы как необязательные"
                  onChange={(checked) => updateDraft({ useAllDimensionsOptional: checked })}
                />
              </div>
            </div>
          )}

          {activeTab === "key" && (
            <div className={styles.section}>
              <h2>Ключевой признак и историчность</h2>
              <p className={styles.sectionText}>
                Составной ключ строится только из обязательных аналитических разрезов.
              </p>
              <div className={styles.keyList}>
                {actualDraft.analyticDimensions.map((dimension) => {
                  const dimensionDescriptor = descriptors.find(
                    (item) => item.id === dimension.descriptorId,
                  );

                  return (
                    <Checkbox
                      checked={dimension.inKey}
                      disabled={!dimension.isRequired}
                      key={dimension.descriptorId}
                      label={`${dimensionDescriptor?.name ?? "Разрез"}${
                        dimension.isRequired ? " (обязательный)" : " (необязательный)"
                      }`}
                      onChange={(checked) =>
                        updateDimension(dimension.descriptorId, { inKey: checked })
                      }
                    />
                  );
                })}
              </div>
              <Toggle
                checked={actualDraft.historyEnabled}
                label="Вести историю изменений значений показателя"
                onChange={(checked) => updateDraft({ historyEnabled: checked })}
              />
            </div>
          )}

          {activeTab === "usage" && (
            <div className={styles.section}>
              <h2>Использование дескриптора</h2>
              <p className={styles.sectionText}>
                Этот список объясняет запрет удаления, если дескриптор уже участвует
                в формулах, разрезах, формах или реестрах.
              </p>
              <div className={styles.usageList}>
                {(actualDraft.usagePlaces ?? []).length === 0 && (
                  <EmptyState
                    description="В мок-данных нет связанных сущностей."
                    title="Дескриптор пока не используется"
                  />
                )}
                {(actualDraft.usagePlaces ?? []).map((place) => (
                  <div className={styles.usageCard} key={`${place.kind}-${place.entityCode}`}>
                    <Badge tone="accent">{getUsagePlaceLabel(place)}</Badge>
                    <strong>{place.entityName}</strong>
                    <span>{place.entityCode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className={styles.summary}>
          <h2>Сводка</h2>
          <div className={styles.summaryGrid}>
            <span>Тип данных</span>
            <strong>{descriptorDataTypeLabels[actualDraft.dataType]}</strong>
            <span>Использование</span>
            <strong>{descriptorUsageLabels[actualDraft.usage]}</strong>
            <span>Разрезы</span>
            <strong>{actualDraft.analyticDimensions.length}</strong>
            <span>Составной ключ</span>
            <strong>
              {actualDraft.analyticDimensions.filter((dimension) => dimension.inKey).length}
            </strong>
          </div>
          <h3>Валидация</h3>
          <div className={styles.issueList}>
            {validationIssues.length === 0 && <Badge tone="success">Ошибок нет</Badge>}
            {validationIssues.map((issue) => (
              <div className={styles.issue} key={`${issue.field}-${issue.message}`}>
                <Badge tone={issue.tone === "error" ? "danger" : "warning"}>
                  {issue.tone === "error" ? "Ошибка" : "Предупреждение"}
                </Badge>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
          {(actualDraft.usagePlaces ?? []).length > 0 && (
            <FieldError>
              Удаление будет запрещено: дескриптор используется в связанных сущностях.
            </FieldError>
          )}
        </aside>
      </section>
    </main>
  );
}
