import { Api } from "../../api/types";

export type Scene = {
    name: string
    code: string
}

export interface SceneApis {
    "": {
      GET: Api<void, Scene[]>;
      DELETE: Api<string, void>;
    };
  }