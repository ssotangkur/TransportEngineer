import express from "express";
import { rootRouter } from "src/api/server";
// import bodyParser from "body-parser";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import listEndpoints from "express-list-endpoints";
import path from "path";

const PORT = 3001;
export const app = express();

app.use(express.json());
// app.use("/api/v1", apiRoute); // This needs to match vite.config.js proxy path
app.use("/api/v1", rootRouter); // This needs to match vite.config.js proxy path

const options = {
  failOnErrors: true,
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LogRocket Express API with Swagger",
      version: "3.0.0",
      description:
        "This is a simple CRUD API application made with Express and documented with Swagger",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "LogRocket",
        url: "https://logrocket.com",
        email: "info@email.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
      },
    ],
  },
  apis: [path.resolve(__dirname, "./") + "/**/*.ts"],
};

console.log(path.resolve(__dirname, "./"));
const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

rootRouter.stack.forEach(function (r: any) {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});

app.listen(PORT, () => console.log(`start listening on port : ${PORT}`));

console.log(listEndpoints(app));
