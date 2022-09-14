
/**
 * Entities are instances of EntityTypes in the world. There can be many entities of the same EntityType.
 * Every EntityType defines what ComponentType it supports
 */


export type ComponentType = {
  name: string,
}

export type EntityType = {
  name: string,

}