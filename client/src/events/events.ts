import { EntityType } from "src/entities/entityType";
import { createEventEmitter } from "./eventEmitter";


export interface EventCallbacks {
  "reload": () => void,
  "fullScreen": () => void,
  "unpause": () => void,
  "pause": () => void,
  "boot": () => void,
  "EntityTypeList:EntityClicked": (entity: EntityType) => void,
};

export type EventName = keyof EventCallbacks;

/**
 * A global strongly typed event emitter. Additional events must be added to the type definition. 
 */
export const Events = createEventEmitter();