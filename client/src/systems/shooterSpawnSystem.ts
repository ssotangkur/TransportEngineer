import { addComponent, addEntity, defineComponent } from 'bitecs'
import {
  AccelerationSumComponent,
  AngleComponent,
  AngularVelocityComponent,
  MoveableComponent,
  TilePositionComponent,
  VelocityComponent,
} from 'src/components/positionComponent'
import { SpriteComponent } from 'src/components/spriteComponent'
import { BaseSystem } from 'src/systems/baseSystem'
import { MapWorld } from './mapSystem'
import { randomVector, setCompFromVec2 } from 'src/utils/vectors'
import { BoidComponent } from 'src/components/boidComponent'
import { AccelVizComponent } from 'src/components/debugComponent'
import { TextureWorld } from './textureSystem'

export type ClockWorld = {
  shooterSpawnSystem: {
    spawnCount: number
  }
}

const MAX_SPAWN_COUNT = 1000
const MAX_INITIAL_SPEED = 3
const MAX_SPEED = 20.0 // tiles per sec
const MAX_ACCEL = 0.5 // tiles/s^2

/**
 * Identifies an entity as a "Shooter"
 */
export const ShooterComponent = defineComponent()

export class ShooterSpawnSystem<I extends MapWorld & TextureWorld> extends BaseSystem<
  MapWorld & TextureWorld,
  I,
  ClockWorld
> {
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
      this.newSpawnTime = now + 100
    }
    this.lastTimeMs = now

    if (this.newSpawnTime !== undefined && now > this.newSpawnTime) {
      // time to spawn

      if (this.world.shooterSpawnSystem.spawnCount < MAX_SPAWN_COUNT) {
        const eid = addEntity(this.world)
        addComponent(this.world, TilePositionComponent, eid)
        TilePositionComponent.x[eid] = 20 * Math.random()
        TilePositionComponent.y[eid] = 20 * Math.random()
        this.world.textureWorld.textureManager.setShooterTexture(eid)
        addComponent(this.world, ShooterComponent, eid)
        addComponent(this.world, VelocityComponent, eid)
        const v = randomVector(Math.random() * MAX_INITIAL_SPEED)
        setCompFromVec2(VelocityComponent, eid, v)
        addComponent(this.world, AngleComponent, eid)
        addComponent(this.world, AngularVelocityComponent, eid)
        addComponent(this.world, AccelerationSumComponent, eid)
        addComponent(this.world, BoidComponent, eid)
        addComponent(this.world, AccelVizComponent, eid)
        addComponent(this.world, MoveableComponent, eid)
        MoveableComponent.maxAcceleration[eid] = MAX_ACCEL
        MoveableComponent.maxSpeed[eid] = MAX_SPEED

        // increment spawnCount
        this.world.shooterSpawnSystem.spawnCount++
      }

      // reset newSpawnTime
      this.newSpawnTime = now + 100
    }
  }
}
