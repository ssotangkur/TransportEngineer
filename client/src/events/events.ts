import { createEventEmitter } from "./eventEmitter";


/**
 * A global strongly typed event emitter. Additional events must be added to the type definition. 
 */
export const Events = createEventEmitter<{
  reload: undefined,
  fullScreen: undefined,
  unpause: undefined,
  pause: undefined,
  boot: undefined,
}>(); 