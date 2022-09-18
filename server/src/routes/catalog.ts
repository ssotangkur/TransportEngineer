import express from "express";
import { promises } from "fs";
import { EntityType } from "common/src/entities/entityType";
import { AddComponentTypeToEntityTypeRequest } from "common/src/api/catalogApi";

export const catalogRoute = express.Router();

const catalogFile = "../client/data/catalog.json";

const readFileAsync = promises.readFile;
const writeFileAsync = promises.writeFile;

const getCatalogJson = async () => {
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

catalogRoute.post(
  "/addComponentTypeToEntityType",
  async (req: express.Request, resp) => {
    console.log(req.body);
    const { entityType, componentType } =
      req.body as AddComponentTypeToEntityTypeRequest;

    console.log({ entityType, componentType });

    const catalog = await getCatalogJson();

    catalog.forEach((e) => {
      if (e.name === entityType.name) {
        e.components.push(componentType);
        e.components.sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    await writeCatalogJson(catalog);
    resp.send();
  }
);
