import { Api, EntityTypeComponentType, ErrorResponse } from "../../api/types";
import { EntityType } from "../../entities/entityType";
import { SubCatalogApis } from "./subCatalog";

export interface CatalogApis {
  routes: {
    subcatalog: SubCatalogApis;
  };
  addComponentTypeToEntityType: {
    POST: Api<EntityTypeComponentType, void | ErrorResponse>;
  };
  removeComponentTypeFromEntityType: {
    POST: Api<EntityTypeComponentType, void | ErrorResponse>;
  };
  "": {
    POST: Api<EntityType[], void | ErrorResponse>;
    GET: Api<void, EntityType[] | ErrorResponse>;
    DELETE: Api<string, EntityType[] | ErrorResponse>;
  };
}
