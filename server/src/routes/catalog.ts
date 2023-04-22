import express from "express";
import { promises } from "fs";
import { EntityType } from "common";
import { ServerImpl } from "common/src/api/types";
import type { CatalogApis } from "common/src/routes/catalog/catalog";
import { subCatImpl } from "./subcatalog";

export const catalogRoute = express.Router();

const catalogFile = "../client/data/catalog.json";

const readFileAsync = promises.readFile;
const writeFileAsync = promises.writeFile;

export const getCatalogJson = async () => {
  const buffer = await readFileAsync(catalogFile, "utf8");
  return JSON.parse(buffer) as EntityType[];
};

const writeCatalogJson = async (catalog: EntityType[]) => {
  const jsonString = JSON.stringify(catalog, null, 2); // Pretty print
  await writeFileAsync(catalogFile, jsonString);
};

catalogRoute.get("/", async (_, resp) => {
  const catalogJson = await getCatalogJson();
  resp.json(catalogJson);
});

catalogRoute.post("/", async (req: express.Request, resp) => {
  try {
    await writeCatalogJson(req.body);
  } catch (error) {
    resp.status(500).json({ error });
    console.error(error);
  }
  resp.send();
});

export const catalogImpl: ServerImpl<CatalogApis> = {
  async postAddComponentTypeToEntityType({ componentType, entityType }) {
    console.log(
      `AddComponentTypeToEntityType: ComponentType:${componentType.name} EntityType:${entityType.name}`
    );
    const catalog = await getCatalogJson();
    catalog.forEach((e) => {
      if (e.name === entityType.name) {
        e.components.push(componentType);
        e.components.sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    await writeCatalogJson(catalog);
    return "foo";
  },
  async postRemoveComponentTypeFromEntityType({ componentType, entityType }) {
    console.log(
      `RemoveComponentTypeFromEntityType: ComponentType:${componentType.name} EntityType:${entityType.name}`
    );
    const catalog = await getCatalogJson();
    catalog.forEach((e) => {
      if (e.name === entityType.name) {
        e.components = e.components.filter((c) => c.name != componentType.name);
        e.components.sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    await writeCatalogJson(catalog);
    return "foo";
  },
  async post() {
    return;
  },
  async get() {
    return getCatalogJson();
  },
  async delete() {
    return "foo";
  },

  routes: {
    subcatalog: subCatImpl,
  },
};

// catalogRoute.post(
//   "/addComponentTypeToEntityType",
//   async (req: express.Request, resp) => {
//     console.log(req.body);
//     const { entityType, componentType } =
//       req.body as AddComponentTypeToEntityTypeApi["requestType"];

//     console.log({ entityType, componentType });

//     const catalog = await getCatalogJson();

//     catalog.forEach((e) => {
//       if (e.name === entityType.name) {
//         e.components.push(componentType);
//         e.components.sort((a, b) => a.name.localeCompare(b.name));
//       }
//     });

//     await writeCatalogJson(catalog);
//     resp.send();
//   }
// );

// catalogRoute.post(
//   "/removeComponentTypeFromEntityType",
//   async (req: express.Request, resp) => {
//     console.log(req.body);
//     const { entityType, componentType } =
//       req.body as RemoveComponentTypeFromEntityTypeApi["requestType"];

//     console.log({ entityType, componentType });

//     const catalog = await getCatalogJson();

//     catalog.forEach((e) => {
//       if (e.name === entityType.name) {
//         e.components = e.components.filter((ct) => {
//           if (ct.name === componentType.name) {
//             return false;
//           }
//           return true;
//         });
//       }
//     });

//     await writeCatalogJson(catalog);
//     resp.send();
//   }
// );
