import { EventCallbacks, Events } from 'src/events/events'

export const subUnsub = <EventName extends keyof EventCallbacks>(
  scene: Phaser.Scene,
  event: EventName,
  cb: EventCallbacks[EventName],
) => {
  Events.on(event, cb)
  scene.events.on('destroy', () => Events.off(event, cb))
}
