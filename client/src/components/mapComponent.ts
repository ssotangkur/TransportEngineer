import { ComponentType, ISchema, IWorld, Types, defineComponent, removeComponent } from 'bitecs'

type MapComponent<S extends ISchema, T> = ComponentType<S> & {
  get: (eid: number) => T | undefined
  set: (eid: number, value: T | undefined) => void
  remove: (world: IWorld, eid: number, reset?: boolean) => void
  add: (world: IWorld, eid: number, reset?: boolean) => void
}

// TODO: Need to delete eid in maps when entity is removed?

// export function myDefineComponent<T extends ISchema | undefined>(schema?: T, size?: number) {
//   return defineComponent(schema, size) as ComponentType<Exclude<T, undefined>>
// }

// export function defineMapComponent<S, Schema>(
//   schema?: Schema,
//   size?: number,
// ): MapComponent<Schema, S> {
//   let component = myDefineComponent(schema, size) as MapComponent<typeof schema, S>

//   const store: Map<number, S | undefined> = new Map()
//   component.get = (eid: number) => store.get(eid)
//   component.set = (eid: number, value: T | undefined) => {
//     store.set(eid, value)
//   }
//   component.remove = (world: IWorld, eid: number, reset: boolean = true) => {
//     if (reset) {
//       store.delete(eid)
//     }
//     removeComponent(world, component, eid, reset)
//   }
//   component.add = (world: IWorld, eid: number, reset: boolean = false) => {
//     if (reset) {
//       store.delete(eid)
//     }
//     removeComponent(world, component, eid, reset)
//   }
//   return component
// }
