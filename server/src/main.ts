import express from "express";
import { rootRouter } from "src/api/server";
import listEndpoints from "express-list-endpoints";
import { createServer } from "http";
import { Server } from "socket.io";
import { getCatalogJson } from "./routes/catalog";

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
httpServer.listen(PORT, () => console.log(`start listening on port : ${PORT}`));
