import { ServerImpl } from "common";
import { System, SystemApis } from "common/routes/system/system";
import fs from 'fs/promises';
import path from "path";
import { Project } from "ts-morph";

/**
 * Systems are manually written so we just want to list what we
 * have and have a key for each one. The only generated file
 * is the allSystems.ts file.
 */

const getSystemsAST = () => {
    const project = new Project({
        tsConfigFilePath: "../client/tsconfig.json",
    });
    //const diagnostics = project.getPreEmitDiagnostics();
    //console.log(project.formatDiagnosticsWithColorAndContext(diagnostics));
    const sourceFiles = project.getSourceFiles();
    const absSystemsDir = path.resolve(systemsDir)

    sourceFiles.filter((srcFile) => {
        const filePath = srcFile.getFilePath()
        const parsedPath = path.parse(filePath)
        const absFilePath = path.resolve(parsedPath.dir)
      
        return absFilePath === absSystemsDir
    }).forEach((srcFile) => {
        console.log(srcFile.getFilePath())
        const classes = srcFile.getClasses();
        classes.forEach((c) => {
            console.log("Class: " + c.getName())
            const createWorldMeth = c.getMethod("createWorld")
            if (createWorldMeth) {
                const params = createWorldMeth.getParameters();
                params.forEach(param => {
                    console.log("ParamName: " + param.getName())
                    // console.log(param.getType())
                    const paramType = param.getType()
                    console.log("ParamType: " + paramType.getText())
                    // param.getType().getApparentType()
                    console.log("ApparentParamType: "  + paramType.getApparentType().getText())
                    console.log("AliasSymbol: "  + paramType.getAliasSymbol()?.getName())
                    
                })
            }
        })
    });
}


// const allSystemsFile = "../client/src/generated/allSystems.ts";
const systemsDir = "../client/src/systems";

const getSystems = async (): Promise<System[]> => {

    getSystemsAST();

    const dirEnts = await fs.readdir(systemsDir, {withFileTypes: true});

    return dirEnts
        .filter(dirEnt => dirEnt.isFile() && dirEnt.name.endsWith("System.ts"))
        .map(file => {
            const absolutePath = path.resolve(systemsDir, file.name)
            return {
                name: file.name.slice(0, -3), // Exclude the ".ts"
                filePath: `vscode://file/${absolutePath}`
            }
        })
}

export const systemImpl: ServerImpl<SystemApis> = {
    get: async (_: void): Promise<System[]> => {
        return getSystems()
    },
    postGenerateAllSystems: async (): Promise<void> => {
        throw new Error("Function not implemented.");
    }
}
    