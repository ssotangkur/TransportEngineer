import express from "express";
import { promises } from 'fs';

export const catalogRoute = express.Router();

const catalogFile = '../client/data/catalog.json';

const readFileAsync = promises.readFile;
const writeFileAsync = promises.writeFile;

catalogRoute.get('/', async (_, resp) => {
  const buffer = await readFileAsync(catalogFile, 'utf8');
  resp.json(JSON.parse(buffer));
});

catalogRoute.post('/', async (req: express.Request, resp) => {
  try {
    const jsonString = JSON.stringify(req.body);
    await writeFileAsync(catalogFile, jsonString);
  } catch (error) {
    resp.status(500).json({error})
    console.error(error);
  }
  resp.send();
});
