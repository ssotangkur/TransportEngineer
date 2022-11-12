import { Api } from "common/src/api/types";
import { CatalogApis } from "./catalog/catalog";

export interface RootApis {
  routes: {
    catalog: CatalogApis;
  };
  "": {
    GET: Api<void, string>;
  };
}
