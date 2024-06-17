import { Api } from "../../api/types";
import { System } from "../system/system";

export type Scene = {
    name: string
    filePath: string
    importPath: string
    systems: System[]
}

export type ScenePersisted = Omit<Scene, 'filePath'>;

export interface SceneApis {
    "": {
      GET: Api<void, Scene[]>;
      DELETE: Api<string, void>;
    };
  }