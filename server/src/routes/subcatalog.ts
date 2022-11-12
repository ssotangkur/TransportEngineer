import { ServerImpl } from "common/src/api/types";
import { SubCatalogApis } from "common/src/routes/catalog/subCatalog";

export const subCatImpl: ServerImpl<SubCatalogApis> = {
  async getTitle() {
    return "title";
  },
};
