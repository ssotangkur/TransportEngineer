import express from "express";
import { rootRouter } from "src/api/server";
import listEndpoints from "express-list-endpoints";
import { createServer } from "http";
import { Namespace, Server } from "socket.io";
import {
  addComponentTypeToEntityType,
  getCatalogJson,
  removeComponentTypeFromEntityType,
} from "./routes/catalog";
import { ComponentType } from "common/src/entities/componentType";
import { EntityType } from "common";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "common/src/api/webSocketTypes";

const PORT = 3001;
export const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  path: "/ws",
});

app.use(express.json());
app.use("/api/v1", rootRouter); // This needs to match vite.config.js proxy path

console.log(listEndpoints(app));

// app.listen(PORT, () => console.log(`start listening on port : ${PORT}`));

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} has connected.`);
  socket.on("subscribeTo", async (message) => {
    console.log(`Client ${socket.id} subscribing to ${message}`);
    // socket.emit(message);
    if (message === "catalog") {
      console.log("Emitting catalog");
      const catalog = await getCatalogJson();
      socket.emit("catalog", catalog);
    }
  });
  socket.emit("connectionAck", { socketId: socket.id });
  socket.emit("catalog", getCatalogJson);
});

const catalogServer: Namespace<ClientToServerEvents, ServerToClientEvents> =
  io.of("/catalog");

catalogServer.on("connection", (socket) => {
  const emitCatalog = async () => {
    console.log("Emitting catalog");
    const catalog = await getCatalogJson();
    socket.emit("catalog", catalog);
    // socket.broadcast.emit("catalog", catalog);
  };

  const handleAddComponentTypeToEntityType = async (
    componentType: ComponentType,
    entityType: EntityType
  ) => {
    await addComponentTypeToEntityType(componentType, entityType);
    await emitCatalog();
  };

  const handleRemoveComponentTypeFromEntityType = async (
    componentType: ComponentType,
    entityType: EntityType
  ) => {
    await removeComponentTypeFromEntityType(componentType, entityType);
    await emitCatalog();
  };

  socket.on("getCatalog", emitCatalog);
  socket.on("addComponentTypeToEntityType", handleAddComponentTypeToEntityType);
  socket.on(
    "removeComponentTypeFromEntityType",
    handleRemoveComponentTypeFromEntityType
  );
  emitCatalog();
});

httpServer.listen(PORT, () => console.log(`start listening on port : ${PORT}`));
