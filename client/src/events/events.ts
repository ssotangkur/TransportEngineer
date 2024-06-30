import { ComponentType } from 'common/src/entities/componentType'
import { EntityType } from 'common/src/entities/entityType'
import { createEventEmitter } from './eventEmitter'

export interface EventCallbacks {
  reloadCatalog: () => void
  fullScreen: () => void
  unpause: () => void
  pause: () => void
  boot: () => void
  regenerateMap: () => void
  'EntityTypeList:EntitySelected': (entityType: EntityType) => void
  addComponentTypeToEntityType: (componentType: ComponentType, entityType: EntityType) => void
  removeComponentTypeFromEntityType: (componentType: ComponentType, entityType: EntityType) => void
}

export type EventName = keyof EventCallbacks

/**
 * A global strongly typed event emitter. Additional events must be added to the type definition.
 */
export const Events = createEventEmitter()
