import type { Descriptor, DescriptorDraft } from "../../../entities/descriptor/model/types";

export type ValidationIssue = {
  field?: string;
  message: string;
  tone: "error" | "warning";
};

export function validateFormula(formula: string, currentLetter = "A"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const trimmedFormula = formula.trim();

  if (!trimmedFormula) {
    issues.push({
      field: "formula",
      message: "Для вычисляемого показателя формула не должна быть пустой.",
      tone: "error",
    });
    return issues;
  }

  if (!/^[A-ZА-Я0-9_\s+\-*/=();#.,]+$/i.test(trimmedFormula)) {
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

  const openedBrackets = (trimmedFormula.match(/\(/g) ?? []).length;
  const closedBrackets = (trimmedFormula.match(/\)/g) ?? []).length;

  if (openedBrackets !== closedBrackets) {
    issues.push({
      field: "formula",
      message: "В формуле есть незакрытая скобка.",
      tone: "error",
    });
  }

  return issues;
}

export function validateDescriptorDraft(
  draft: DescriptorDraft,
  descriptors: Descriptor[],
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

  if (draft.usage === "metric" || draft.usage === "hybrid") {
    issues.push(...validateFormula(draft.formula, "A").filter((issue) => draft.formula));
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
  });

  return issues;
}
