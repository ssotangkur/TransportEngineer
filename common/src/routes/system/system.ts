import { Api } from "../../api/types";

export type System = {
  name: string
  filePath: string
}

export interface SystemApis {
    generateAllSystems: {
        POST: Api<void, void>;
    }
    "": {
      GET: Api<void, System[]>;
    };
  }