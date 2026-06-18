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
import type { Catalog } from "../../entities/catalog/model/types";
import type {
  AnalyticDimension,
  ConditionalDimensionEffect,
  ConditionalDimensionOperator,
  ConditionalDimensionRule,
  Descriptor,
  DescriptorDraft,
  DescriptorUsagePlace,
} from "../../entities/descriptor/model/types";
import { useGetCatalogsQuery, useGetDescriptorQuery, useGetDescriptorsQuery } from "../../shared/api";
import { validateDescriptorDraft, type ValidationIssue } from "../../shared/lib/validation";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  FieldError,
  Icon,
  IconButton,
  Input,
  Select,
  Table,
  Tabs,
  Toggle,
  type TableColumn,
} from "../../shared/ui";
import { FormulaEditor } from "./FormulaEditor/FormulaEditor";
import styles from "./DescriptorPage.module.scss";

type DescriptorTab = "general" | "formula" | "dimensions" | "key" | "usage";

const tabItems = [
  { label: "Общее", value: "general" },
  { label: "Формула", value: "formula" },
  { label: "Разрезы", value: "dimensions" },
  { label: "Ключ и история", value: "key" },
  { label: "Использование", value: "usage" },
] satisfies Array<{ label: string; value: DescriptorTab }>;

const conditionalOperatorOptions = [
  { label: "равно", value: "==" },
  { label: "не равно", value: "!=" },
  { label: "в списке", value: "in" },
  { label: "не в списке", value: "not-in" },
] satisfies Array<{ label: string; value: ConditionalDimensionOperator }>;

const conditionalEffectOptions = [
  { label: "сделать обязательным", value: "required" },
  { label: "сделать необязательным", value: "optional" },
  { label: "не является разрезом", value: "excluded" },
] satisfies Array<{ label: string; value: ConditionalDimensionEffect }>;

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
    conditionalRules: [],
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

function parseRestrictionValues(restriction?: string) {
  return (restriction ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function stringifyRestrictionValues(values: string[]) {
  return values.join(", ");
}

function getCatalogElementLabel(catalog: Catalog, elementIdOrLabel: string) {
  const element =
    catalog.elements.find((item) => item.id === elementIdOrLabel) ??
    catalog.elements.find((item) =>
      Object.values(item.values).some(
        (value) => String(value).toLocaleLowerCase("ru-RU") ===
          elementIdOrLabel.toLocaleLowerCase("ru-RU"),
      ),
    );

  if (!element) {
    return elementIdOrLabel;
  }

  return catalog.displayTemplate.replace(/\{([A-Z0-9_]+)\}/g, (_, key) =>
    String(element.values[key] ?? ""),
  );
}

function isCatalogElementSelected(
  catalog: Catalog,
  elementId: string,
  selectedValues: string[],
) {
  const element = catalog.elements.find((item) => item.id === elementId);

  if (!element) {
    return false;
  }

  return selectedValues.some((selectedValue) => {
    const normalizedSelectedValue = selectedValue.toLocaleLowerCase("ru-RU");

    return (
      selectedValue === element.id ||
      Object.values(element.values).some(
        (value) =>
          String(value).toLocaleLowerCase("ru-RU") === normalizedSelectedValue,
      )
    );
  });
}

function validateRestrictionInput(
  value: string,
  dimensionDescriptor: Descriptor,
) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Введите значение";
  }

  if (dimensionDescriptor.dataType === "number" && Number.isNaN(Number(trimmedValue))) {
    return "Для числового разреза нужно ввести число";
  }

  if (
    dimensionDescriptor.dataType === "boolean" &&
    !["true", "false", "да", "нет", "1", "0"].includes(
      trimmedValue.toLocaleLowerCase("ru-RU"),
    )
  ) {
    return "Для логического разреза используйте true/false, да/нет или 1/0";
  }

  if (
    ["datetime", "period"].includes(dimensionDescriptor.dataType) &&
    Number.isNaN(Date.parse(trimmedValue))
  ) {
    return "Для даты или периода используйте формат YYYY-MM-DD";
  }

  return undefined;
}

type RestrictionEditorProps = {
  catalogs: Catalog[];
  dimension: AnalyticDimension;
  dimensionDescriptor?: Descriptor;
  onChange: (patch: Partial<AnalyticDimension>) => void;
};

function RestrictionEditor({
  catalogs,
  dimension,
  dimensionDescriptor,
  onChange,
}: RestrictionEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | undefined>();
  const values = parseRestrictionValues(dimension.restriction);
  const targetCatalog = dimensionDescriptor?.catalogId
    ? catalogs.find((catalog) => catalog.id === dimensionDescriptor.catalogId)
    : undefined;

  function updateValues(nextValues: string[]) {
    onChange({
      restriction: nextValues.length
        ? stringifyRestrictionValues(nextValues)
        : undefined,
    });
  }

  function addValue(nextValue: string) {
    if (!dimensionDescriptor) {
      return;
    }

    const trimmedValue = nextValue.trim();
    const nextError = validateRestrictionInput(trimmedValue, dimensionDescriptor);

    if (nextError) {
      setInputError(nextError);
      return;
    }

    if (values.includes(trimmedValue)) {
      setInputError("Такое значение уже добавлено");
      return;
    }

    updateValues([...values, trimmedValue]);
    setInputValue("");
    setInputError(undefined);
  }

  function removeValue(valueToRemove: string) {
    updateValues(values.filter((value) => value !== valueToRemove));
  }

  if (!dimensionDescriptor) {
    return <span>—</span>;
  }

  const hint =
    dimensionDescriptor.dataType === "catalog"
      ? "Выберите элементы целевого справочника"
      : dimensionDescriptor.dataType === "number"
        ? "Добавляйте числа по одному"
        : dimensionDescriptor.dataType === "period" ||
            dimensionDescriptor.dataType === "datetime"
          ? "Формат периода или даты: YYYY-MM-DD"
          : "Добавляйте значения по одному";

  return (
    <div className={styles.restrictionEditor}>
      {values.length > 0 ? (
        <div className={styles.restrictionChips}>
          {values.map((value) => (
            <span className={styles.restrictionChip} key={value}>
              {targetCatalog ? getCatalogElementLabel(targetCatalog, value) : value}
              <button
                aria-label={`Удалить допустимое значение ${value}`}
                type="button"
                onClick={() => removeValue(value)}
              >
                <Icon name="remove" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <span className={styles.restrictionEmpty}>Все значения разрешены</span>
      )}

      {dimensionDescriptor.dataType === "catalog" && targetCatalog ? (
        <div className={styles.restrictionCatalogPicker}>
          <span>{hint}</span>
          <div className={styles.restrictionCatalogOptions}>
            {targetCatalog.elements
              .filter(
                (element) =>
                  !isCatalogElementSelected(targetCatalog, element.id, values),
              )
              .map((element) => (
                <button
                  key={element.id}
                  type="button"
                  onClick={() => addValue(element.id)}
                >
                  {getCatalogElementLabel(targetCatalog, element.id)}
                </button>
              ))}
            {targetCatalog.elements.every((element) =>
              isCatalogElementSelected(targetCatalog, element.id, values),
            ) && <span className={styles.restrictionEmpty}>Все элементы уже добавлены</span>}
          </div>
        </div>
      ) : (
        <div className={styles.restrictionInputRow}>
          <Input
            error={inputError}
            hint={hint}
            placeholder="Введите значение"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              setInputError(undefined);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addValue(inputValue);
              }
            }}
          />
          <Button
            icon="plus"
            variant="secondary"
            onClick={() => addValue(inputValue)}
          >
            Добавить
          </Button>
        </div>
      )}
    </div>
  );
}

type ConditionalRulesEditorProps = {
  dimensions: AnalyticDimension[];
  descriptors: Descriptor[];
  rules: ConditionalDimensionRule[];
  onAdd: () => void;
  onRemove: (ruleId: string) => void;
  onUpdate: (
    ruleId: string,
    patch: Partial<ConditionalDimensionRule>,
  ) => void;
};

function getDimensionLabel(
  descriptorId: string,
  descriptors: Descriptor[],
) {
  const descriptor = descriptors.find((item) => item.id === descriptorId);

  return descriptor ? `${descriptor.code} / ${descriptor.name}` : "Неизвестный разрез";
}

function getRulePreview(
  rule: ConditionalDimensionRule,
  descriptors: Descriptor[],
) {
  const operatorLabel =
    conditionalOperatorOptions.find((item) => item.value === rule.operator)
      ?.label ?? rule.operator;
  const effectLabel =
    conditionalEffectOptions.find((item) => item.value === rule.effect)?.label ??
    rule.effect;
  const sourceLabel = getDimensionLabel(rule.sourceDimensionId, descriptors);
  const targetLabels = rule.targetDimensionIds
    .map((descriptorId) => getDimensionLabel(descriptorId, descriptors))
    .join(", ");

  return `Если ${sourceLabel} ${operatorLabel} ${rule.value || "..."} -> ${effectLabel}: ${
    targetLabels || "разрез не выбран"
  }`;
}

function ConditionalRulesEditor({
  dimensions,
  descriptors,
  rules,
  onAdd,
  onRemove,
  onUpdate,
}: ConditionalRulesEditorProps) {
  const dimensionOptions = dimensions.map((dimension) => ({
    label: getDimensionLabel(dimension.descriptorId, descriptors),
    value: dimension.descriptorId,
  }));

  function toggleTarget(
    rule: ConditionalDimensionRule,
    descriptorId: string,
    checked: boolean,
  ) {
    const nextTargetIds = checked
      ? [...rule.targetDimensionIds, descriptorId]
      : rule.targetDimensionIds.filter((item) => item !== descriptorId);

    onUpdate(rule.id, { targetDimensionIds: nextTargetIds });
  }

  return (
    <section className={styles.conditionalRules}>
      <div className={styles.conditionalHeader}>
        <div>
          <div className={styles.sectionTitleRow}>
            <h2>Условные правила обязательности</h2>
            <Badge tone="warning">Черновик</Badge>
          </div>
          <p>
            Макет ПроУБП.FR-001.010: если значение одного разреза подходит под условие,
            другие разрезы можно сделать обязательными, необязательными или исключить.
          </p>
        </div>
        <Button
          disabled={dimensions.length < 2}
          icon="plus"
          variant="secondary"
          onClick={onAdd}
        >
          Добавить правило
        </Button>
      </div>

      {dimensions.length < 2 && (
        <EmptyState
          description="Для условного правила нужно минимум два аналитических разреза: один в условии и один как результат."
          title="Недостаточно разрезов"
        />
      )}

      {dimensions.length >= 2 && rules.length === 0 && (
        <EmptyState
          description="Добавьте правило вида: если [разрез] [оператор] [значение], то [режим] для выбранных разрезов."
          title="Условные правила пока не заданы"
        />
      )}

      {rules.length > 0 && (
        <div className={styles.conditionalList}>
          {rules.map((rule, index) => (
            <article className={styles.conditionalCard} key={rule.id}>
              <div className={styles.conditionalCardHeader}>
                <div>
                  <strong>Правило {index + 1}</strong>
                  <span>{getRulePreview(rule, descriptors)}</span>
                </div>
                <IconButton
                  ariaLabel="Удалить условное правило"
                  icon="trash"
                  tone="danger"
                  onClick={() => onRemove(rule.id)}
                />
              </div>

              <div className={styles.conditionalGrid}>
                <Select
                  label="Если разрез"
                  options={dimensionOptions}
                  value={rule.sourceDimensionId}
                  onChange={(sourceDimensionId) =>
                    onUpdate(rule.id, { sourceDimensionId })
                  }
                />
                <Select
                  label="Оператор"
                  options={conditionalOperatorOptions}
                  value={rule.operator}
                  onChange={(operator) => onUpdate(rule.id, { operator })}
                />
                <Input
                  hint={
                    rule.operator === "in" || rule.operator === "not-in"
                      ? "Несколько значений через запятую"
                      : "Одно значение для сравнения"
                  }
                  label="Значение"
                  placeholder="Например: org-1 или Москва"
                  value={rule.value}
                  onChange={(event) =>
                    onUpdate(rule.id, { value: event.target.value })
                  }
                />
                <Select
                  label="То"
                  options={conditionalEffectOptions}
                  value={rule.effect}
                  onChange={(effect) => onUpdate(rule.id, { effect })}
                />
              </div>

              <div className={styles.conditionalTargets}>
                <span>Применить к разрезам</span>
                <div>
                  {dimensions.map((dimension) => (
                    <Checkbox
                      checked={rule.targetDimensionIds.includes(
                        dimension.descriptorId,
                      )}
                      disabled={dimension.descriptorId === rule.sourceDimensionId}
                      key={dimension.descriptorId}
                      label={getDimensionLabel(dimension.descriptorId, descriptors)}
                      onChange={(checked) =>
                        toggleTarget(rule, dimension.descriptorId, checked)
                      }
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className={styles.conditionalNote}>
        <Badge tone="neutral">MVP</Badge>
        <span>
          Сейчас это визуальный конструктор и мок-валидация. Реальное применение
          правил при вводе значений нужно будет привязать к DSL/API после согласования.
        </span>
      </div>
    </section>
  );
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
    () =>
      actualDraft ? validateDescriptorDraft(actualDraft, descriptors, catalogs) : [],
    [actualDraft, catalogs, descriptors],
  );

  const dimensionDescriptors = descriptors.filter(
    (item) => item.usage === "dimension",
  );
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
  const isUsageChangeLocked =
    currentDraft.usage === "metric" &&
    !isNew &&
    (currentDraft.usagePlaces?.length ?? 0) > 0;

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
      usage: isUsageChangeLocked ? currentDraft.usage : defaultUsage,
    });

    if (isUsageChangeLocked) {
      toast("Способ использования не изменен: показатель уже используется");
      return;
    }

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
      conditionalRules: (currentDraft.conditionalRules ?? [])
        .map((rule) => ({
          ...rule,
          targetDimensionIds: rule.targetDimensionIds.filter(
            (descriptorId) => descriptorId !== descriptorIdToRemove,
          ),
        }))
        .filter(
          (rule) =>
            rule.sourceDimensionId !== descriptorIdToRemove &&
            rule.targetDimensionIds.length > 0,
        ),
    });
  }

  function addConditionalRule() {
    const [sourceDimension, targetDimension] = currentDraft.analyticDimensions;

    if (!sourceDimension || !targetDimension) {
      toast.error("Для условного правила нужно минимум два разреза");
      return;
    }

    updateDraft({
      conditionalRules: [
        ...(currentDraft.conditionalRules ?? []),
        {
          effect: "required",
          id: `rule-${Date.now()}`,
          operator: "==",
          sourceDimensionId: sourceDimension.descriptorId,
          targetDimensionIds: [targetDimension.descriptorId],
          value: "",
        },
      ],
    });
  }

  function updateConditionalRule(
    ruleId: string,
    patch: Partial<ConditionalDimensionRule>,
  ) {
    updateDraft({
      conditionalRules: (currentDraft.conditionalRules ?? []).map((rule) => {
        if (rule.id !== ruleId) {
          return rule;
        }

        const nextRule = { ...rule, ...patch };

        if (
          patch.sourceDimensionId &&
          nextRule.targetDimensionIds.includes(patch.sourceDimensionId)
        ) {
          nextRule.targetDimensionIds = nextRule.targetDimensionIds.filter(
            (descriptorId) => descriptorId !== patch.sourceDimensionId,
          );
        }

        return nextRule;
      }),
    });
  }

  function removeConditionalRule(ruleId: string) {
    updateDraft({
      conditionalRules: (currentDraft.conditionalRules ?? []).filter(
        (rule) => rule.id !== ruleId,
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
      render: (dimension) => {
        const dimensionDescriptor = descriptors.find(
          (item) => item.id === dimension.descriptorId,
        );

        return (
          <RestrictionEditor
            catalogs={catalogs}
            dimension={dimension}
            dimensionDescriptor={dimensionDescriptor}
            onChange={(patch) => updateDimension(dimension.descriptorId, patch)}
          />
        );
      },
      title: "Допустимые значения",
      width: "420px",
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
                  disabled={isUsageChangeLocked}
                  hint={
                    isUsageChangeLocked
                      ? "Нельзя сменить способ использования показателя, который уже используется."
                      : undefined
                  }
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
              {actualDraft.usage === "metric" ? (
                <FormulaEditor
                  currentDescriptor={actualDraft}
                  descriptors={descriptors}
                  issues={formulaIssues}
                  onFormulaIssuesChange={setFormulaIssues}
                  onUpdate={updateDraft}
                />
              ) : (
                <EmptyState
                  description="Этот дескриптор используется как разрез данных. Формулы настраиваются только для показателей, которые нужно вычислять из других показателей."
                  title="Формула доступна только для показателя"
                />
              )}
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
              <ConditionalRulesEditor
                descriptors={descriptors}
                dimensions={actualDraft.analyticDimensions}
                rules={actualDraft.conditionalRules ?? []}
                onAdd={addConditionalRule}
                onRemove={removeConditionalRule}
                onUpdate={updateConditionalRule}
              />
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
