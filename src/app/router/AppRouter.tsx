import { Navigate, Route, Routes } from "react-router-dom";
import { CatalogPage } from "../../pages/CatalogPage/CatalogPage";
import { CatalogsListPage } from "../../pages/CatalogsListPage/CatalogsListPage";
import { DescriptorPage } from "../../pages/DescriptorPage/DescriptorPage";
import { DescriptorsListPage } from "../../pages/DescriptorsListPage/DescriptorsListPage";
import { NotFoundPage } from "../../pages/NotFoundPage/NotFoundPage";
import { AppLayout } from "../../widgets/AppLayout";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate replace to="/descriptors" />} />
        <Route path="descriptors" element={<DescriptorsListPage />} />
        <Route path="descriptors/:descriptorId" element={<DescriptorPage />} />
        <Route path="catalogs" element={<CatalogsListPage />} />
        <Route path="catalogs/:catalogId" element={<CatalogPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
