import { ComponentType } from "src/entities/componentType";
import { EntityType } from "src/entities/entityType";

export type AddComponentTypeToEntityTypeRequest = {
  entityType: EntityType;
  componentType: ComponentType;
};
