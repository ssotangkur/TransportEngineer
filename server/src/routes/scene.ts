import { ServerImpl } from "common";
import { Scene, SceneApis} from "common/routes/scene/scene";
import express from "express";
import fs from "fs/promises";
import path from "path";

export const sceneRoute = express.Router();


const sceneDir = "../client/src/scenes";

const getScenes = async (): Promise<Scene[]> => {
    const dirEnts = await fs.readdir(sceneDir, {withFileTypes: true});
    return dirEnts.filter(dirEnt => dirEnt.isFile()).map((file): Scene => {
        const absolutePath = path.resolve( sceneDir, file.name )
        return {
            name: file.name,
            code: `vscode://file/${absolutePath}`,
        }
    });
}

export const sceneImpl: ServerImpl<SceneApis> = {
    get: async (_: void): Promise<Scene[]> => {
        return getScenes();
    },
    delete: function (_: string): Promise<void> {
        throw new Error("Function not implemented.");
    }
}
    