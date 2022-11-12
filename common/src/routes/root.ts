import { Api } from "../api/types";
import { CatalogApis } from "./catalog/catalog";

export interface RootApis {
  routes: {
    catalog: CatalogApis;
  };
  "": {
    GET: Api<void, string>;
  };
}
