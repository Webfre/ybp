import type {
  ConditionalDimensionRule,
  Descriptor,
  DescriptorDraft,
  FormulaArgument,
} from "../../../entities/descriptor/model/types";
import type { Catalog } from "../../../entities/catalog/model/types";

export type ValidationIssue = {
  field?: string;
  message: string;
  tone: "error" | "warning";
};

type ValidateFormulaOptions = {
  arguments?: FormulaArgument[];
  currentLetter?: string;
};

const formulaTokenPattern = /\b[A-Z]\b/g;

function parseRestrictionValues(restriction?: string) {
  return (restriction ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function catalogHasElementValue(catalog: Catalog, valueToCheck: string) {
  const normalizedValue = valueToCheck.toLocaleLowerCase("ru-RU");

  return catalog.elements.some(
    (element) =>
      element.id === valueToCheck ||
      Object.values(element.values).some(
        (value) => String(value).toLocaleLowerCase("ru-RU") === normalizedValue,
      ),
  );
}

function validateRestrictionValue(
  value: string,
  dimensionDescriptor: Descriptor,
  catalogs: Catalog[],
) {
  if (dimensionDescriptor.dataType === "number" && Number.isNaN(Number(value))) {
    return "Допустимое значение разреза должно быть числом.";
  }

  if (
    dimensionDescriptor.dataType === "boolean" &&
    !["true", "false", "да", "нет", "1", "0"].includes(
      value.toLocaleLowerCase("ru-RU"),
    )
  ) {
    return "Допустимое значение логического разреза должно быть true/false, да/нет или 1/0.";
  }

  if (
    ["datetime", "period"].includes(dimensionDescriptor.dataType) &&
    Number.isNaN(Date.parse(value))
  ) {
    return "Допустимое значение даты или периода должно быть в формате YYYY-MM-DD.";
  }

  if (dimensionDescriptor.dataType === "catalog") {
    const targetCatalog = dimensionDescriptor.catalogId
      ? catalogs.find((catalog) => catalog.id === dimensionDescriptor.catalogId)
      : undefined;

    if (!targetCatalog) {
      return "Для справочного разреза не найден целевой справочник.";
    }

    if (!catalogHasElementValue(targetCatalog, value)) {
      return "Допустимое значение отсутствует в целевом справочнике.";
    }
  }

  return undefined;
}

function validateConditionalRules(
  rules: ConditionalDimensionRule[],
  draft: DescriptorDraft,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dimensionIds = new Set(
    draft.analyticDimensions.map((dimension) => dimension.descriptorId),
  );
  const keyDimensionIds = new Set(
    draft.analyticDimensions
      .filter((dimension) => dimension.inKey)
      .map((dimension) => dimension.descriptorId),
  );

  rules.forEach((rule) => {
    if (!dimensionIds.has(rule.sourceDimensionId)) {
      issues.push({
        field: `conditionalRule:${rule.id}`,
        message: "Условное правило ссылается на разрез, которого нет в аналитических разрезах показателя.",
        tone: "error",
      });
    }

    if (!rule.value.trim()) {
      issues.push({
        field: `conditionalRule:${rule.id}:value`,
        message: "В условном правиле нужно заполнить значение условия.",
        tone: "error",
      });
    }

    if (rule.targetDimensionIds.length === 0) {
      issues.push({
        field: `conditionalRule:${rule.id}:targets`,
        message: "В условном правиле нужно выбрать хотя бы один разрез-результат.",
        tone: "error",
      });
    }

    rule.targetDimensionIds.forEach((targetDimensionId) => {
      if (!dimensionIds.has(targetDimensionId)) {
        issues.push({
          field: `conditionalRule:${rule.id}:targets`,
          message: "Условное правило меняет разрез, которого нет в аналитических разрезах показателя.",
          tone: "error",
        });
      }

      if (targetDimensionId === rule.sourceDimensionId) {
        issues.push({
          field: `conditionalRule:${rule.id}:targets`,
          message: "Разрез из условия нельзя одновременно менять этим же правилом.",
          tone: "warning",
        });
      }

      if (rule.effect === "excluded" && keyDimensionIds.has(targetDimensionId)) {
        issues.push({
          field: `conditionalRule:${rule.id}:targets`,
          message: "Разрез, который может быть исключен условным правилом, нельзя оставлять в составном ключе.",
          tone: "error",
        });
      }
    });
  });

  rules.forEach((rule) => {
    rule.targetDimensionIds.forEach((targetDimensionId) => {
      const hasCycle = rules.some(
        (candidate) =>
          candidate.id !== rule.id &&
          candidate.sourceDimensionId === targetDimensionId &&
          candidate.targetDimensionIds.includes(rule.sourceDimensionId),
      );

      if (hasCycle) {
        issues.push({
          field: `conditionalRule:${rule.id}`,
          message: "В условных правилах найдена встречная зависимость между разрезами.",
          tone: "warning",
        });
      }
    });
  });

  return issues;
}

export function validateFormula(
  formula: string,
  options: ValidateFormulaOptions | string = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const currentLetter =
    typeof options === "string" ? options : options.currentLetter ?? "A";
  const selectedArguments = typeof options === "string" ? [] : options.arguments ?? [];
  const selectedLetters = new Set(selectedArguments.map((argument) => argument.letter));
  const trimmedFormula = formula.trim();

  if (!trimmedFormula) {
    issues.push({
      field: "formula",
      message: "Для вычисляемого показателя формула не должна быть пустой.",
      tone: "error",
    });
    return issues;
  }

  if (!/^[A-ZА-Я0-9_\s+\-*/=();#.,<>!]+$/i.test(trimmedFormula)) {
    issues.push({
      field: "formula",
      message: "Формула содержит недопустимые символы.",
      tone: "error",
    });
  }

  const [leftPart, rightPart] = trimmedFormula.split("=").map((part) => part.trim());

  if (leftPart && leftPart !== currentLetter) {
    issues.push({
      field: "formula",
      message: `Левая часть формулы должна содержать текущий показатель ${currentLetter}.`,
      tone: "error",
    });
  }

  if (!rightPart) {
    issues.push({
      field: "formula",
      message: "Правая часть формулы не заполнена.",
      tone: "error",
    });
  }

  const usedLetters = new Set(trimmedFormula.match(formulaTokenPattern) ?? []);
  const usedRightPartLetters = new Set(rightPart?.match(formulaTokenPattern) ?? []);

  usedLetters.forEach((letter) => {
    if (!selectedLetters.has(letter)) {
      issues.push({
        field: "formula",
        message: `Аргумент ${letter} используется в формуле, но не выбран в списке аргументов.`,
        tone: "error",
      });
    }
  });

  selectedLetters.forEach((letter) => {
    if (letter !== currentLetter && !usedRightPartLetters.has(letter)) {
      issues.push({
        field: "formula",
        message: `Аргумент ${letter} выбран, но не используется в правой части формулы.`,
        tone: "warning",
      });
    }
  });

  const openedBrackets = (trimmedFormula.match(/\(/g) ?? []).length;
  const closedBrackets = (trimmedFormula.match(/\)/g) ?? []).length;

  if (openedBrackets !== closedBrackets) {
    issues.push({
      field: "formula",
      message: "В формуле есть незакрытая скобка.",
      tone: "error",
    });
  }

  if (rightPart && !/[+\-*/(]/.test(rightPart) && usedRightPartLetters.size > 1) {
    issues.push({
      field: "formula",
      message: "В правой части несколько аргументов без оператора между ними.",
      tone: "error",
    });
  }

  return issues;
}

export function validateDescriptorDraft(
  draft: DescriptorDraft,
  descriptors: Descriptor[],
  catalogs: Catalog[] = [],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const normalizedCode = draft.code.trim().toLocaleLowerCase("ru-RU");
  const normalizedName = draft.name.trim().toLocaleLowerCase("ru-RU");

  if (!draft.code.trim()) {
    issues.push({
      field: "code",
      message: "Уникальный код обязателен. Можно сгенерировать значение автоматически.",
      tone: "error",
    });
  }

  if (!draft.name.trim()) {
    issues.push({
      field: "name",
      message: "Наименование дескриптора обязательно.",
      tone: "error",
    });
  }

  if (
    normalizedCode &&
    descriptors.some(
      (descriptor) =>
        descriptor.id !== draft.id &&
        descriptor.code.toLocaleLowerCase("ru-RU") === normalizedCode,
    )
  ) {
    issues.push({
      field: "code",
      message: "Дескриптор с таким кодом уже существует.",
      tone: "error",
    });
  }

  if (
    normalizedName &&
    descriptors.some(
      (descriptor) =>
        descriptor.id !== draft.id &&
        descriptor.name.toLocaleLowerCase("ru-RU") === normalizedName,
    )
  ) {
    issues.push({
      field: "name",
      message: "При включенной глобальной уникальности такое наименование занято.",
      tone: "warning",
    });
  }

  if (draft.dataType === "catalog" && !draft.catalogId) {
    issues.push({
      field: "catalogId",
      message: "Для типа данных Справочник нужно выбрать целевой справочник.",
      tone: "error",
    });
  }

  if (draft.usage === "metric") {
    issues.push(
      ...validateFormula(draft.formula, {
        arguments: draft.formulaArguments,
        currentLetter: "A",
      }).filter((issue) => draft.formula),
    );
  }

  draft.analyticDimensions.forEach((dimension) => {
    if (dimension.inKey && !dimension.isRequired) {
      issues.push({
        field: `dimension:${dimension.descriptorId}`,
        message: "В составной ключ нельзя включить необязательный аналитический разрез.",
        tone: "error",
      });
    }

    const dimensionDescriptor = descriptors.find(
      (descriptor) => descriptor.id === dimension.descriptorId,
    );

    if (dimensionDescriptor && dimensionDescriptor.usage === "metric") {
      issues.push({
        field: `dimension:${dimension.descriptorId}`,
        message: "Показатель нельзя добавить в аналитические разрезы.",
        tone: "error",
      });
    }

    if (dimensionDescriptor) {
      parseRestrictionValues(dimension.restriction).forEach((value) => {
        const restrictionError = validateRestrictionValue(
          value,
          dimensionDescriptor,
          catalogs,
        );

        if (restrictionError) {
          issues.push({
            field: `dimension:${dimension.descriptorId}:restriction`,
            message: `${dimensionDescriptor.name}: ${restrictionError}`,
            tone: "error",
          });
        }
      });
    }
  });

  issues.push(...validateConditionalRules(draft.conditionalRules ?? [], draft));

  return issues;
}
