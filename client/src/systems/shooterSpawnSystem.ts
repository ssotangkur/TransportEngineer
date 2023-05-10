import { addComponent, addEntity } from 'bitecs'
import { WorldPositionComponent } from 'src/components/positionComponent'
import { SpriteComponent } from 'src/components/spriteComponent'
import { BaseSystem } from 'src/systems/baseSystem'
import { MapWorld } from './mapSystem'

export type ClockWorld = {
  shooterSpawnSystem: {
    spawnCount: number
  }
}

const MAX_SPAWN_COUNT = 100

export class ShooterSpawnSystem<I extends MapWorld> extends BaseSystem<MapWorld, I, ClockWorld> {
  private lastTimeMs = 0
  private newSpawnTime?: number

  createWorld(_worldIn: I) {
    const clockWorld = {
      shooterSpawnSystem: {
        spawnCount: 0,
      },
    }
    return clockWorld
  }

  update(time: number, _delta: number): void {
    const now = time

    if (this.lastTimeMs == 0) {
      this.newSpawnTime = now + 1000
    }
    this.lastTimeMs = now

    if (this.newSpawnTime !== undefined && now > this.newSpawnTime) {
      // time to spawn

      if (this.world.shooterSpawnSystem.spawnCount < MAX_SPAWN_COUNT) {
        const eid = addEntity(this.world)
        addComponent(this.world, WorldPositionComponent, eid)
        WorldPositionComponent.x[eid] = 1000 * Math.random()
        WorldPositionComponent.y[eid] = 1000 * Math.random()
        addComponent(this.world, SpriteComponent, eid)
        SpriteComponent.spriteId[eid] = 10
        SpriteComponent.spriteKey[eid] = 0

        // increment spawnCount
        this.world.shooterSpawnSystem.spawnCount++
      }

      // reset newSpawnTime
      this.newSpawnTime = now + 1000
    }
  }
}
