import { ComponentType } from 'common/src/entities/componentType'
import { EntityType } from 'common/src/entities/entityType'
import { createEventEmitter } from './eventEmitter'
import { MapInfo } from 'src/utils/mapInfo'
import { ChunkInfo } from 'src/systems/chunkVisibilitySystem'
import { AABB } from 'src/utils/aabb'
import { WangColor } from 'src/mapping/mapGenerator'

export interface EventCallbacks {
  reloadCatalog: () => void
  fullScreen: () => void
  unpause: () => void
  pause: () => void
  boot: () => void
  regenerateMap: () => void
  mapInfoUpdated: (mapInfo: MapInfo) => void
  chunkInfoUpdated: (chunkInfo: ChunkInfo) => void
  'EntityTypeList:EntitySelected': (entityType: EntityType) => void
  addComponentTypeToEntityType: (componentType: ComponentType, entityType: EntityType) => void
  removeComponentTypeFromEntityType: (componentType: ComponentType, entityType: EntityType) => void

  // Emitted when the step time had been calculated
  updateStepTime: (stepTimeMs: number) => void

  miniMapUpdated: (data: MiniMapUpdate) => void
}

export type EventName = keyof EventCallbacks

/**
 * A global strongly typed event emitter. Additional events must be added to the type definition.
 */
export const Events = createEventEmitter()

export type MiniMapUpdate = {
  colorMap: (r: number, c: number) => WangColor
  rect: AABB
}
