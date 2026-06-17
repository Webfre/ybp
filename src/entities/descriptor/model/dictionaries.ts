import type { DescriptorDataType, DescriptorUsage } from "./types";

export const descriptorDataTypeLabels: Record<DescriptorDataType, string> = {
  boolean: "Логический",
  catalog: "Справочник",
  datetime: "Дата и время",
  file: "Файл",
  number: "Число",
  period: "Период",
  string: "Строка",
};

export const descriptorUsageLabels: Record<DescriptorUsage, string> = {
  dimension: "Разрез данных",
  hybrid: "Гибрид",
  metric: "Показатель",
};

export const descriptorDataTypeOptions = Object.entries(descriptorDataTypeLabels).map(
  ([value, label]) => ({ label, value: value as DescriptorDataType }),
);

export const descriptorUsageOptions = Object.entries(descriptorUsageLabels).map(
  ([value, label]) => ({ label, value: value as DescriptorUsage }),
);

export function getDefaultUsageByDataType(
  dataType: DescriptorDataType,
): DescriptorUsage {
  return dataType === "catalog" || dataType === "period" ? "dimension" : "metric";
}
