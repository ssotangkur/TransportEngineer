import { Api } from "src/api/types";

export interface SubCatalogApis {
  title: { GET: Api<string, string> };
}
