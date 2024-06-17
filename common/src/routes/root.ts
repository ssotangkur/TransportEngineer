import { Api } from "../api/types";
import { CatalogApis } from "./catalog/catalog";
import { SceneApis } from "./scene/scene";
import { SystemApis } from "./system/system";

export interface RootApis {
  routes: {
    catalog: CatalogApis;
    scene: SceneApis;
    system: SystemApis;
  };
  "": {
    GET: Api<undefined, string>;
  };
}
