import { Method, METHODS, ServerImpl } from "common/src/api/types";
import { RootApis } from "common/src/routes/root";
import express, { Router } from "express";
import { catalogImpl } from "src/routes/catalog";

// export type Api<ReqType, RespType> = {
//   request: ReqType;
//   response: RespType;
// };

const rootRoute: ServerImpl<RootApis> = {
  routes: {
    catalog: catalogImpl,
  },
  async get() {
    return "Transport Engineer API";
  },
};

const splitMethod = (methodName: string): [Method, string] => {
  let result: [Method, string] = ["GET", ""];
  METHODS.forEach((m) => {
    if (methodName.startsWith(m.toLowerCase())) {
      result = [m, methodName.slice(m.length)];
    }
  });
  return result;
};

export const makeRouter = <T>(impl: ServerImpl<T>): Router => {
  console.log("test");
  const router = express.Router();
  for (const [key, val] of Object.entries(impl)) {
    if (key === "routes") {
      // Recursively create routers for nested routes
      const pathImplMap = val as { [key: string]: ServerImpl<any> };
      for (const [path, childImpl] of Object.entries(pathImplMap)) {
        if (!childImpl) {
          console.log(`path: ${path} has null childImpl ${childImpl}`);
        }
        router.use(`/${path}`, makeRouter(childImpl));
      }
    } else {
      // key will be prefixed with the method
      const [method, resource] = splitMethod(key);
      switch (method) {
        case "POST":
          router.post(`/${resource}`, async (req, resp) => {
            const implFunc = val as (req: any) => Promise<any>;
            const result = await implFunc(req.body);
            resp.send(result);
          });
          break;
        case "GET":
          router.get(`/${resource}`, async (req, resp) => {
            const implFunc = val as (req: any) => Promise<any>;
            const result = await implFunc(req.body);
            resp.send(result);
          });
          break;
        case "DELETE":
          router.delete(`/${resource}`, async (req, resp) => {
            const implFunc = val as (req: any) => Promise<any>;
            const result = await implFunc(req.body);
            resp.send(result);
          });
          break;
        case "PUT":
          router.put(`/${resource}`, async (req, resp) => {
            const implFunc = val as (req: any) => Promise<any>;
            const result = await implFunc(req.body);
            resp.send(result);
          });
          break;
      }
    }
  }

  return router;
};

export const rootRouter = makeRouter(rootRoute);
