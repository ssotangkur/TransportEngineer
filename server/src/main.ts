import express from "express";
import { rootRouter } from "src/api/server";
import listEndpoints from "express-list-endpoints";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3001;
export const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  path: "/ws",
});

app.use(express.json());
// app.use("/api/v1", apiRoute); // This needs to match vite.config.js proxy path
app.use("/api/v1", rootRouter); // This needs to match vite.config.js proxy path

console.log(listEndpoints(app));

// app.listen(PORT, () => console.log(`start listening on port : ${PORT}`));

io.on("connection", (socket) => {
  console.log("Connection");
  socket.on("hello", (...args) => {
    console.log("hello" + args);
  });
});
httpServer.listen(PORT, () => console.log(`start listening on port : ${PORT}`));
