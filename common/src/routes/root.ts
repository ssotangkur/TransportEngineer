import { Api } from "../api/types";
import { CatalogApis } from "./catalog/catalog";
import { SceneApis } from "./scene/scene";

export interface RootApis {
  routes: {
    catalog: CatalogApis;
    scene: SceneApis;
  };
  "": {
    GET: Api<undefined, string>;
  };
}
