import { ErrorResponse, Method, METHODS, ServerImpl } from "common/src/api/types";
import { RootApis } from "common/src/routes/root";
import express, { RequestHandler, Router } from "express";
import { catalogImpl } from "src/routes/catalog";
import { sceneImpl } from "src/routes/scene";
import { systemImpl } from "src/routes/system";

const rootRoute: ServerImpl<RootApis> = {
  routes: {
    catalog: catalogImpl,
    scene: sceneImpl,
    system: systemImpl,
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

const createHandler = (val: any): RequestHandler => {
  return async (req, resp) => {
    const implFunc = val as (req: any) => Promise<any>;
    try {
      const result = await implFunc(req.body);
      resp.send(result);
    } catch (e) {
      const errResp: ErrorResponse = e instanceof Error ? {
        typeName: 'error',
        message: e.message,
        stack: e.stack,
        cause: e.cause,
      } : {
        typeName: 'error',
        message: String(e),
      }
      
      resp.status(400).send(errResp)
    }
  }
}

export const makeRouter = <T>(impl: ServerImpl<T>): Router => {
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
          router.post(`/${resource}`, createHandler(val));
          break;
        case "GET":
          router.get(`/${resource}`, createHandler(val));
          break;
        case "DELETE":
          router.delete(`/${resource}`, createHandler(val));
          break;
        case "PUT":
          router.put(`/${resource}`, createHandler(val));
          break;
      }
    }
  }

  return router;
};

export const rootRouter = makeRouter(rootRoute);
