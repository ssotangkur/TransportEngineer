import express from "express";
import { apiRoute } from "src/routes/apiRoute";
const PORT = 3001;
export const app = express();

app.use(express.json());
app.use("/api/v1", apiRoute); // This needs to match vite.config.js proxy path

app.listen(PORT, () => console.log(`start listening on port : ${PORT}`));
