import { EntityType } from "src/entities/entityType";

export interface ServerToClientEvents {
  catalog: () => EntityType[];
}
