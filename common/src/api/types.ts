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
export type ErrorMessage = string;

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
