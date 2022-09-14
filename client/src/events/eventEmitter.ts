/** A strongly typed event emitter built on top of Phaser's event emitter */
const internalEmitter = new Phaser.Events.EventEmitter();

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>
    (eventName: K, fn: EventReceiver<T[K]>): void;
  off<K extends EventKey<T>>
    (eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>
    (eventName: K, params: T[K]): void;
}

export const createEventEmitter = <T extends EventMap>(): Emitter<T> => {
  return {
    on(key, fn) {
      internalEmitter.on(key, fn);
    },
    off(key, fn) {
      internalEmitter.off(key, fn);
    },
    emit(key, data) {
      internalEmitter.emit(key, data);
    },
  };
}
