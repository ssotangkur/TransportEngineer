// import { CatalogApis } from "src/routes/catalog/catalog";
// import { SubCatalogApis } from "src/routes/catalog/subCatalog";
// import { RootApis } from "../routes/root";
import { ComponentType } from "../entities/componentType";
import { EntityType } from "../entities/entityType";

export const METHODS = ["POST", "GET", "PUT", "DELETE"] as const;
export type Method = typeof METHODS[number];

export type Api<Request, Response> = {
  request: Request;
  response: Response;
};

type ApiToFunction<T> = T extends Api<infer Req, infer Resp>
  ? (request: Req) => Resp
  : never;

type ApiToAsyncFunction<T> = T extends Api<infer Req, infer Resp>
  ? (request: Req) => Promise<Resp>
  : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

export type EntityTypeComponentType = {
  entityType: EntityType;
  componentType: ComponentType;
};

export type Output<SuccessType, ErrorType> = {
  data?: SuccessType;
  error?: ErrorType;
};

/**
 * Always use this type for errors. The message will be provided by useRest's error result. 
 */
export type ErrorResponse = {
  typeName: 'error'
  message: string
  stack?: string | undefined
  cause?: any
};

type Handlers<T> = Omit<T, "routes">;

type Context<T> = T extends { context: string } ? T["context"] : undefined;
export type FullContextPath<T> = T extends { parent: infer Parent }
  ? `${Context<T>}.${FullContextPath<Parent>}`
  : Context<T>;

export type ServerImpl<T> = UnionToIntersection<
  {
    [Url in keyof Handlers<T>]: {
      [Method in keyof Handlers<T>[Url] as `${Lowercase<
        Method & string
      >}${Capitalize<Url & string>}`]: ApiToAsyncFunction<
        Handlers<T>[Url][Method]
      >;
    };
  }[keyof Handlers<T>]
> &
  (T extends { routes: infer TRoute }
    ? {
        routes: {
          [Path in keyof TRoute]: ServerImpl<TRoute[Path]>;
        };
      }
    : {});

export type ClientApi<T> = UnionToIntersection<
  {
    [Url in keyof Handlers<T>]: {
      [Method in keyof Handlers<T>[Url] as `${Lowercase<
        Method & string
      >}${Capitalize<Url & string>}`]: ApiToFunction<Handlers<T>[Url][Method]>;
    };
  }[keyof Handlers<T>]
> &
  (T extends { routes: infer TRoute }
    ? {
        routes: {
          [Path in keyof TRoute]: ClientApi<TRoute[Path]>;
        };
      }
    : {});

/// Example: JoinPath<"foo/bar", "hello"> = 'foo/bar/hello'
type JoinPath<A, B> = A extends string
  ? B extends string
    ? `${A}${"" extends B ? "" : "/"}${B}`
    : never
  : never;

type MethodApiToFunc<FullPath, M, A> = A extends Api<infer Req, infer Resp>
  ? (path: FullPath, method: M, req: Req) => Promise<Resp>
  : never;

type Flatten<FullPath, T> = UnionToIntersection<
  {
    [Method in keyof T]: MethodApiToFunc<FullPath, Method, T[Method]>;
  }[keyof T]
>;

export type RoutesToFunc<ContextPath, T> = UnionToIntersection<
  | {
      [Url in keyof Handlers<T>]: Flatten<
        JoinPath<ContextPath, Url>,
        Handlers<T>[Url]
      >;
    }[keyof Handlers<T>]
  | (T extends { routes: infer TRoute }
      ? {
          [Path in keyof TRoute]: RoutesToFunc<
            JoinPath<ContextPath, Path>,
            TRoute[Path]
          >;
        }[keyof TRoute]
      : {})
>;

/**
 * Excludes the key ""
 */
type NonEmptyHandlers<T> = Exclude<Handlers<T>, "">;

type RemoveUndefinedParam<T> = T extends (req: infer Req) => infer Resp
  ? Req extends undefined
    ? () => Resp
    : T
  : never;

/**
 * Converts:
 * {
 *   POST: Api<Req, Resp>
 *   GET: Api<Req, Resp>
 * }
 *
 * To:
 * {
 *   get: (req: Req) => Promise<Resp>
 *   post: (req: Req) => Promise<Resp>
 * }
 */
type MethodApiToMethodFuncs<T> = {
  [M in keyof T as `${Lowercase<M extends string ? M : "">}`]: T[M] extends Api<
    infer Req,
    infer Resp
  >
    ? RemoveUndefinedParam<(req: Req) => Promise<Resp>>
    : never;
};

/**
 * Converts:
 * {
 *   resource: {
 *     POST: Api<Req, Req>
 *     GET: Api<Req, Req>
 *   }
 * }
 *
 * To:
 * {
 *   resource: {
 *     post: (req: Req) => Resp
 *     get: (req: Req) => Resp
 *   }
 * }
 */
type HandlersToMethodFuncs<T> = {
  [Url in keyof NonEmptyHandlers<T>]: MethodApiToMethodFuncs<
    NonEmptyHandlers<T>[Url]
  >;
};

/**
 * Converts:
 * {
 *   "": {
 *     POST: Api<Req, Req>
 *     GET: Api<Req, Req>
 *   }
 * }
 *
 * To:
 * {
 *   post: (req: Req) => Resp
 *   get: (req: Req) => Resp
 * }
 */
type UnnamedMethodApiToMethodFuncs<T> = T extends { "": infer MethodApi }
  ? MethodApiToMethodFuncs<MethodApi>
  : {};

/**
 * Converts:
 * {
 *   routes: {
 *     catalog: CatalogApis
 *     books: BooksApis
 *   }
 * }
 *
 * To:
 * {
 *   catalog: (Recurse<CatalogApis>)
 *   books: (Recurse<BookApis>)
 * }
 *
 */
type RoutesToMethodFuncs<T> = T extends { routes: infer MethodApi }
  ? {
      [ContextPath in keyof MethodApi]: ApisToProxy<MethodApi[ContextPath]>;
    }
  : {};

/**
 * {
 *   resource: {
 *     post: (req) => resp
 *   }
 *   get: (req) => resp
 *   catalog: {
 *     get: (req) => resp
 *     resource : {
 *       post: (req) => resp
 *     }
 *   }
 * }
 *
 */
export type ApisToProxy<T> = HandlersToMethodFuncs<T> &
  UnnamedMethodApiToMethodFuncs<T> &
  RoutesToMethodFuncs<T>;

// const z = {} as ApisToProxy<RootApis>;
// z.catalog.addComponentTypeToEntityType.post();

// const g: RoutesToFunc<"apis/v1", RootApis> = () => {
//   throw Error;
// };
// const c = g("apis/v1", "GET", undefined);
// const d = g("apis/v1/catalog/subcatalog/title", "GET", "foo");
