export type DescriptorDataType =
  | "number"
  | "string"
  | "datetime"
  | "file"
  | "boolean"
  | "period"
  | "catalog";

export type DescriptorUsage = "metric" | "dimension";

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

export type ConditionalDimensionOperator = "==" | "!=" | "in" | "not-in";

export type ConditionalDimensionEffect =
  | "required"
  | "optional"
  | "excluded";

export type ConditionalDimensionRule = {
  effect: ConditionalDimensionEffect;
  id: string;
  sourceDimensionId: string;
  targetDimensionIds: string[];
  value: string;
  operator: ConditionalDimensionOperator;
};

export type DescriptorUsagePlace = {
  entityCode: string;
  entityName: string;
  kind: "formula" | "dimension" | "catalog" | "form" | "registry";
};

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
  conditionalRules?: ConditionalDimensionRule[];
  updatedAt: string;
  usage: DescriptorUsage;
  useAllDimensionsOptional: boolean;
  usagePlaces: DescriptorUsagePlace[];
};

export type DescriptorDraft = Omit<Descriptor, "updatedAt" | "usagePlaces"> & {
  usagePlaces?: DescriptorUsagePlace[];
};
