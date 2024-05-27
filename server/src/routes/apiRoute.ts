import express from "express";
import { catalogRoute } from "./catalog";
import { sceneRoute } from "./scene";

export const apiRoute = express.Router();

apiRoute.get("/", (_, res) => {
  res.send("Transport Engineer API");
});

apiRoute.use('/catalog', catalogRoute);
apiRoute.use('/scene', sceneRoute);