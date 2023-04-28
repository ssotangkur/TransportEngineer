import { ComponentType } from "src/entities/componentType";
import { EntityType } from "src/entities/entityType";

export interface ServerToClientEvents {
  catalog: (catalog: EntityType[]) => void;
}

export interface ClientToServerEvents {
  getCatalog: () => void;
  addComponentTypeToEntityType: (
    componentType: ComponentType,
    entityType: EntityType
  ) => void;
  removeComponentTypeFromEntityType: (
    componentType: ComponentType,
    entityType: EntityType
  ) => void;
}
