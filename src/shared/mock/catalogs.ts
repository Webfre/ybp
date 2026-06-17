import type { Catalog } from "../../entities/catalog/model/types";

export const mockCatalogs: Catalog[] = [
  {
    attributes: [
      { code: "CODE", id: "org-code", isRequired: true, name: "Код", type: "string" },
      { code: "NAME", id: "org-name", isRequired: true, name: "Наименование", type: "string" },
      { code: "REGION", id: "org-region", isRequired: false, name: "Регион", type: "string" },
    ],
    code: "ORG",
    displayTemplate: "{CODE} - {NAME}",
    elements: [
      { id: "org-1", values: { CODE: "MSK", NAME: "Москва", REGION: "Центр" } },
      { id: "org-2", values: { CODE: "SPB", NAME: "Санкт-Петербург", REGION: "Северо-Запад" } },
      { id: "org-3", values: { CODE: "KZN", NAME: "Казань", REGION: "Поволжье" } },
    ],
    hierarchyEnabled: true,
    id: "org",
    name: "Организации",
    usages: [
      {
        code: "ORG_REF",
        id: "org-ref",
        kind: "descriptor",
        name: "Организация",
      },
    ],
    versioningEnabled: false,
  },
  {
    attributes: [
      { code: "CODE", id: "res-code", isRequired: true, name: "Код", type: "string" },
      { code: "NAME", id: "res-name", isRequired: true, name: "Наименование", type: "string" },
      { code: "UNIT", id: "res-unit", isRequired: true, name: "Единица измерения", type: "string" },
    ],
    code: "RES",
    displayTemplate: "{NAME}, {UNIT}",
    elements: [
      { id: "res-1", values: { CODE: "OIL", NAME: "Нефть", UNIT: "т" } },
      { id: "res-2", values: { CODE: "GAS", NAME: "Газ", UNIT: "м3" } },
    ],
    hierarchyEnabled: false,
    id: "res",
    name: "Ресурсы",
    usages: [
      {
        code: "RESOURCE_REF",
        id: "resource-ref",
        kind: "descriptor",
        name: "Ресурс",
      },
    ],
    versioningEnabled: true,
  },
  {
    attributes: [
      { code: "CODE", id: "tech-code", isRequired: true, name: "Код", type: "string" },
      { code: "NAME", id: "tech-name", isRequired: true, name: "Модель", type: "string" },
      { code: "RESOURCE", id: "tech-resource", isRequired: true, name: "Ресурс", targetCatalogId: "res", type: "catalog" },
    ],
    code: "TECH_MODEL",
    displayTemplate: "{CODE} / {NAME}",
    elements: [
      { id: "tech-1", values: { CODE: "DRILL-12", NAME: "Буровая модель 12", RESOURCE: "OIL" } },
    ],
    hierarchyEnabled: false,
    id: "tech-model",
    name: "Модели техники",
    usages: [],
    versioningEnabled: false,
  },
];
