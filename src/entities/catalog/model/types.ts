export type CatalogAttributeType =
  | "string"
  | "number"
  | "datetime"
  | "boolean"
  | "catalog";

export type CatalogAttribute = {
  code: string;
  id: string;
  isRequired: boolean;
  name: string;
  targetCatalogId?: string;
  type: CatalogAttributeType;
};

export type CatalogElement = {
  id: string;
  values: Record<string, string | number | boolean>;
};

export type CatalogUsage = {
  code: string;
  id: string;
  kind: "descriptor" | "catalogAttribute";
  name: string;
};

export type Catalog = {
  attributes: CatalogAttribute[];
  code: string;
  displayTemplate: string;
  elements: CatalogElement[];
  hierarchyEnabled: boolean;
  id: string;
  name: string;
  usages: CatalogUsage[];
  versioningEnabled: boolean;
};
