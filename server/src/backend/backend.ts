import express from "express";
import { apiRoute } from "src/routes/apiRoute";
const PORT = 3001;
export const app = express();

app.use(express.json());
app.use('/', apiRoute);

app.listen(PORT, () => console.log(`start listening on port : ${PORT}`));