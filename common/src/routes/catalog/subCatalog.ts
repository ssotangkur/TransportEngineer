import { Api } from "../../api/types";

export interface SubCatalogApis {
  title: { GET: Api<string, string> };
}
