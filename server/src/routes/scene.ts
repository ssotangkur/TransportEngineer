import { ServerImpl } from "common";
import { Scene, SceneApis, ScenePersisted} from "common/routes/scene/scene";
import express from "express";
import fs from "fs/promises";
import path from "path";

export const sceneRoute = express.Router();



const sceneFile = "../client/data/scenes.json";
const generatedPath = "../client/src/generated";

const getScenes = async (): Promise<Scene[]> => {
    const buffer = await fs.readFile(sceneFile, "utf8");
    const partialScenes = JSON.parse(buffer) as ScenePersisted[];
    return partialScenes.map((s) => {
        const absolutePath = path.resolve( generatedPath, s.name + ".ts" )
        return {
            ...s,
            filePath: `vscode://file/${absolutePath}`
        }
    })
    

    // const dirEnts = await fs.readdir(sceneDir, {withFileTypes: true});
    // return dirEnts.filter(dirEnt => dirEnt.isFile()).map((file): Scene => {
    //     const absolutePath = path.resolve( sceneDir, file.name )
    //     return {
    //         name: file.name,
    //         importPath: `generated`
    //         importPath: `vscode://file/${absolutePath}`,
    //     }
    // });
}

export const sceneImpl: ServerImpl<SceneApis> = {
    get: async (_: void): Promise<Scene[]> => {
        return getScenes();
    },
    delete: function (_: string): Promise<void> {
        throw new Error("Function not implemented.");
    }
}
    