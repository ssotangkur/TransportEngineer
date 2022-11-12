import {
  Api,
  EntityTypeComponentType,
  ErrorMessage,
} from "common/src/api/types";
import { EntityType } from "common/src/entities/entityType";
import { SubCatalogApis } from "./subCatalog";

export interface CatalogApis {
  routes: {
    subcatalog: SubCatalogApis;
  };
  addComponentTypeToEntityType: {
    POST: Api<EntityTypeComponentType, void | ErrorMessage>;
  };
  removeComponentTypeFromEntityType: {
    POST: Api<EntityTypeComponentType, void | ErrorMessage>;
  };
  "": {
    POST: Api<EntityType[], void | ErrorMessage>;
    GET: Api<void, EntityType[] | ErrorMessage>;
    DELETE: Api<string, EntityType[] | ErrorMessage>;
  };
}
