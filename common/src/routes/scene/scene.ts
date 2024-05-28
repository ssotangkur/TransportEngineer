import { Api } from "../../api/types";

export type Scene = {
    name: string
    filePath: string
    importPath: string
}

export type ScenePersisted = Omit<Scene, 'filePath'>;

export interface SceneApis {
    "": {
      GET: Api<void, Scene[]>;
      DELETE: Api<string, void>;
    };
  }