import type { IWorld } from 'bitecs'
import { OrchestratableScene } from 'src/editor/scenes/orchestratableScene'

/**
 * Subclasses should define their own type for the world they want to support.
 * This forces the caller to ensure the world contains all the properties
 * you are expecting. The world can be used to then store and access singletons
 * needed by your system.
 *
 * The WorldIn type allows the subclass to force a certain type of world is
 * provided to them in the constructor.
 *
 * The WorldOut type allows the subclass to say what world type they have added
 * to the world.
 */
export abstract class BaseSystem<WorldIn extends IWorld, WorldOut extends IWorld> {
  public world: WorldIn & WorldOut

  constructor(protected scene: OrchestratableScene, protected worldIn: WorldIn) {
    this.world = this.createWorld(worldIn)
  }

  /**
   * Subclasses should implement this to return a compatible world matching
   * the world type they defined.
   */
  abstract createWorld(worldIn: WorldIn): WorldOut & WorldIn

  preload() {
    // no-op child classes should override if needed
  }

  create() {
    // no-op child classes should override if needed
  }

  update(_time: number, _delta: number) {
    // no-op child classes should override if needed
  }

  mergeWorlds<PrevWorld extends IWorld, AddedWorld extends IWorld>(
    world: PrevWorld,
    worldToAdd: AddedWorld,
  ): PrevWorld & AddedWorld {
    return Object.assign(world, worldToAdd)
  }
}
