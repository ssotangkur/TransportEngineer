import type { IWorld } from 'bitecs'
import { EventCallbacks, Events } from 'src/events/events'

/**
 * Subclasses should define their own type for the world they want to support.
 * This forces the caller to ensure the world contains all the properties
 * you are expecting. The world can be used to then store and access singletons
 * needed by your system.
 *
 * The WorldIn type allows the subclass to force a certain type of world is
 * provided to them in the constructor.
 *
 * The WorldAdded type allows the subclass to say what world type they have added
 * to the world.
 */
export abstract class BaseSystem<
  WorldRequired extends IWorld,
  WorldIn extends WorldRequired,
  WorldAdded extends IWorld,
> {
  public world: WorldRequired & WorldAdded

  constructor(protected scene: Phaser.Scene, protected worldIn: WorldIn) {
    this.world = this.mergeWorlds(worldIn, this.createWorld(worldIn))
  }

  /**
   * Subclasses should implement this to return a compatible world matching
   * the world type they defined.
   */
  abstract createWorld(worldIn: WorldRequired): WorldAdded

  preload() {
    // no-op, child classes should override if needed
  }

  create() {
    // no-op, child classes should override if needed
  }

  update(_time: number, _delta: number) {
    // no-op, child classes should override if needed
  }

  mergeWorlds<PrevWorld extends IWorld, AddedWorld extends IWorld>(
    world: PrevWorld,
    worldToAdd: AddedWorld,
  ): PrevWorld & AddedWorld {
    return Object.assign(world, worldToAdd)
  }

  forEidIn(query: (world: IWorld) => number[], cb: (eid: number) => void) {
    query(this.world).forEach(cb)
  }

  _log(logger: (...args: any[]) => void, ...args: any[]) {
    logger(`[${this.constructor.name}]`, ...args)
  }

  debug(...args: any[]) {
    this._log(console.debug, ...args)
  }
  info(...args: any[]) {
    this._log(console.info, ...args)
  }
  warn(...args: any[]) {
    this._log(console.warn, ...args)
  }
  error(...args: any[]) {
    this._log(console.error, ...args)
  }

  /**
   * Helper method to register a subscription to an event and automatically unsubscribe when the scene is destroyed
   */
  subUnsub<EventName extends keyof EventCallbacks>(
    event: EventName,
    cb: EventCallbacks[EventName],
  ) {
    Events.on(event, cb)
    this.scene.events.on('destroy', () => Events.off(event, cb))
  }
}

type TWorldNew<B> = B extends BaseSystem<IWorld, IWorld, infer O> ? O : never

export class SystemBuilderClass<InitialWorldIn extends IWorld> {
  constructor(
    private scene: Phaser.Scene,
    private world: InitialWorldIn,
    private internalInstances: BaseSystem<any, any, any>[] = [],
    private systemClasses = new Set<any>(),
  ) {}

  build<
    WorldRequired extends InitialWorldIn,
    WorldIn extends WorldRequired & InitialWorldIn,
    S extends BaseSystem<InitialWorldIn, WorldIn, any>,
  >(systemClass: new (scene: Phaser.Scene, world: InitialWorldIn) => S) {
    if (this.systemClasses.has(systemClass)) {
      throw new Error('Attempted to add duplicate system')
    }
    this.systemClasses.add(systemClass)
    const instance = new systemClass(this.scene, this.world)
    this.internalInstances.push(instance)
    return new SystemBuilderClass<TWorldNew<S> & WorldIn>(
      this.scene,
      instance.world,
      this.internalInstances,
      this.systemClasses,
    )
  }

  instances() {
    return this.internalInstances
  }
}

// type ClassOf<T> = T extends { new: (...args: any) => T } ? T : never

// type Chain<
//   WorldIn extends IWorld,
//   WorldNew extends IWorld,
//   S extends BaseSystem<WorldIn, WorldNew>,
// > = {
//   build: <P extends BaseSystem<WorldIn, WorldNew>>(
//     SClass: new (scene: OrchestratableScene, world: WorldIn) => P,
//   ) => Chain<S['world'], BaseSystem<S['world'], IWorld>>
// }

// function createInstance<A extends BaseSystem<any, any>>(c: new (...args) => A): A {
//   return new c()
// }

// export function chain<WorldIn extends IWorld>(
//   scene: OrchestratableScene,
//   worldIn: WorldIn,
//   instances: BaseSystem<any, any>[] = [],
// ) {
//   return {
//     build: <WorldNew extends IWorld, P extends BaseSystem<WorldIn, WorldNew>>(
//       SClass: new (scene: OrchestratableScene, world: WorldIn) => P,
//     ) => {
//       const instance = new SClass(scene, worldIn)
//       instances.push(instance)
//       return chain(scene, instance.world, instances)
//     },
//   }
// }

// export function createSystemsChain<B extends BaseSystem<any, any>>(
//   scene: OrchestratableScene,
//   initialWorld: any,
//   systems: (new (scene: OrchestratableScene, world: any) => B)[],
// ) {
//   const createdSystems = []
//   let curWorld = initialWorld
//   for (let i = 0; i < systems.length; i++) {
//     const System = systems[i]
//     const systemInstance = new System(scene, curWorld)
//     createdSystems.push(systemInstance)
//     curWorld = systemInstance.world
//   }
//   return createdSystems
// }

// export class SystemBuilderClass<WorldIn extends IWorld, S extends BaseSystem<WorldIn, any>> {
//   constructor(
//     private scene: OrchestratableScene,
//     private world: WorldIn,
//     private internalInstances: BaseSystem<any, any>[] = [],
//   ) {}

//   build(systemClass: new (scene: OrchestratableScene, world: WorldIn) => S) {
//     const instance = new systemClass(this.scene, this.world)
//     this.internalInstances.push(instance)
//     // return new SystemBuilderClass<WorldIn & TWorldNew<S>, BaseSystem<TWorldNew<S> & WorldIn, any>>(
//     return new SystemBuilderClass<WorldIn & TWorldNew<S>, BaseSystem<typeof instance.world, any>>(
//       this.scene,
//       instance.world,
//       this.internalInstances,
//     )
//   }

//   instances() {
//     return this.internalInstances
//   }
// }
