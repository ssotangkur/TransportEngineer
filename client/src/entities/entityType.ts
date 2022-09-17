
/**
 * Entities are instances of EntityTypes in the world. There can be many entities of the same EntityType.
 * Every EntityType defines what ComponentType it supports
 */

import { ComponentType } from "./componentType";



export interface EntityType {
  name: string,
  components: ComponentType[],
}