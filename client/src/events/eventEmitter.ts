import { EventCallbacks } from './events'

/** A strongly typed event emitter built on top of Phaser's event emitter */

interface Emitter {
  on<E extends keyof EventCallbacks>(eventName: E, fn: EventCallbacks[E]): void
  off<E extends keyof EventCallbacks>(eventName: E, fn: EventCallbacks[E]): void
  emit<E extends keyof EventCallbacks>(eventName: E, ...params: Parameters<EventCallbacks[E]>): void
}

export const createEventEmitter = (): Emitter => {
  const internalEmitter = new Phaser.Events.EventEmitter()

  return {
    on(key, fn) {
      internalEmitter.on(key, fn)
    },
    off(key, fn) {
      internalEmitter.off(key, fn)
    },
    emit(key, ...data) {
      internalEmitter.emit(key, ...data)
    },
  }
}
