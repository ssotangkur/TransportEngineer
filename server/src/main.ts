import express from "express";
import { rootRouter } from "src/api/server";
import listEndpoints from "express-list-endpoints";

const PORT = 3001;
export const app = express();

app.use(express.json());
// app.use("/api/v1", apiRoute); // This needs to match vite.config.js proxy path
app.use("/api/v1", rootRouter); // This needs to match vite.config.js proxy path

console.log(listEndpoints(app));

app.listen(PORT, () => console.log(`start listening on port : ${PORT}`));
