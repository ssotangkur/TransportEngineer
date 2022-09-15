import express from "express";
import { catalogRoute } from "./catalog";

export const apiRoute = express.Router();

apiRoute.get("/", (_, res) => {
  res.send("Transport Engineer API");
});

apiRoute.use('/catalog', catalogRoute);