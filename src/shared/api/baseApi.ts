import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Catalog } from "../../entities/catalog/model/types";
import type { Descriptor } from "../../entities/descriptor/model/types";
import { mockCatalogs, mockDescriptors } from "../mock";

const delay = (ms = 120) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const baseApi = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getCatalog: builder.query<Catalog | undefined, string>({
      queryFn: async (id) => {
        await delay();
        return { data: mockCatalogs.find((catalog) => catalog.id === id) };
      },
    }),
    getCatalogs: builder.query<Catalog[], void>({
      queryFn: async () => {
        await delay();
        return { data: mockCatalogs };
      },
    }),
    getDescriptor: builder.query<Descriptor | undefined, string>({
      queryFn: async (id) => {
        await delay();
        return { data: mockDescriptors.find((descriptor) => descriptor.id === id) };
      },
    }),
    getDescriptors: builder.query<Descriptor[], void>({
      queryFn: async () => {
        await delay();
        return { data: mockDescriptors };
      },
    }),
  }),
  reducerPath: "baseApi",
});

export const {
  useGetCatalogQuery,
  useGetCatalogsQuery,
  useGetDescriptorQuery,
  useGetDescriptorsQuery,
} = baseApi;
