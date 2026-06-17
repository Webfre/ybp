export type DescriptorDataType =
  | "number"
  | "string"
  | "datetime"
  | "file"
  | "boolean"
  | "period"
  | "catalog";

export type DescriptorUsage = "metric" | "dimension" | "hybrid";

export type FormulaArgument = {
  descriptorId: string;
  letter: string;
};

export type AnalyticDimension = {
  descriptorId: string;
  inKey: boolean;
  isRequired: boolean;
  restriction?: string;
};

export type DescriptorUsagePlace = {
  entityCode: string;
  entityName: string;
  kind: "formula" | "dimension" | "catalog" | "form" | "registry";
};

export type DescriptorValidationStatus = "valid" | "warning" | "error";

export type Descriptor = {
  analyticDimensions: AnalyticDimension[];
  catalogId?: string;
  code: string;
  dataType: DescriptorDataType;
  formula: string;
  formulaArguments: FormulaArgument[];
  historyEnabled: boolean;
  id: string;
  name: string;
  status: DescriptorValidationStatus;
  updatedAt: string;
  usage: DescriptorUsage;
  useAllDimensionsOptional: boolean;
  usagePlaces: DescriptorUsagePlace[];
};

export type DescriptorDraft = Omit<Descriptor, "status" | "updatedAt" | "usagePlaces"> & {
  usagePlaces?: DescriptorUsagePlace[];
};
