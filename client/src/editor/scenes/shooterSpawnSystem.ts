import { IWorld, addComponent, addEntity } from 'bitecs'
import { WorldPositionComponent } from 'src/components/positionComponent'
import { SpriteComponent } from 'src/components/spriteComponent'
import { BaseSystem } from 'src/systems/baseSystem'

export type ClockWorld = {
  clock: number
}

export class ShooterSpawnSystem<I extends IWorld> extends BaseSystem<I, ClockWorld> {
  private lastTimeMs = 0
  private newSpawnTime?: number

  createWorld(worldIn: I) {
    const clockWorld = {
      clock: 0,
    }
    return this.mergeWorlds(worldIn, clockWorld)
  }

  update(time: number, _delta: number): void {
    const now = time

    if (this.lastTimeMs == 0) {
      this.newSpawnTime = now + 1000
    }

    if (this.newSpawnTime !== undefined && this.lastTimeMs > this.newSpawnTime) {
      // time to spawn
      const eid = addEntity(this.world)
      addComponent(this.world, WorldPositionComponent, eid)
      WorldPositionComponent.x[eid] = 1000 * Math.random()
      WorldPositionComponent.y[eid] = 1000 * Math.random()
      addComponent(this.world, SpriteComponent, eid)
      SpriteComponent.spriteId[eid] = 10

      // reset newSpawnTime
      this.newSpawnTime = now + 1000
    }

    this.lastTimeMs = now
  }
}
