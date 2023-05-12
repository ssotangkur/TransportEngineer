import { ComponentType, IWorld, addComponent, defineQuery, enterQuery, exitQuery } from 'bitecs'
import { SpatialWorld } from './spatialSystem'
import { BaseSystem } from './baseSystem'
import { BoidComponent } from 'src/components/boidComponent'
import {
  SpatialComponent,
  TileMoveComponent,
  TilePositionComponent,
} from 'src/components/positionComponent'
import Phaser from 'phaser'
import { Vector2 as Vector2Schema } from 'src/components/positionComponent'
import { Client } from 'src/utils/spatialHashGrid/spatialHashGrid'
import { ShooterComponent } from './shooterSpawnSystem'

const perception = 3
const MAX_SPEED = 3.0 // tiles per sec

export const boidQuery = defineQuery([BoidComponent, TilePositionComponent])

type Vector2 = Phaser.Math.Vector2

const shooterPositionQuery = defineQuery([ShooterComponent, TilePositionComponent])
const shooterPositionEnter = enterQuery(shooterPositionQuery)
const shooterPositionExit = exitQuery(shooterPositionQuery)

export class BoidSystem<WorldIn extends SpatialWorld> extends BaseSystem<
  SpatialWorld,
  WorldIn,
  IWorld
> {
  createWorld(): IWorld {
    return {}
  }

  update(_time: number, delta: number): void {
    this._attachComponentsToShooters()

    let pos = new Phaser.Math.Vector2()
    let velocity = new Phaser.Math.Vector2()

    this.forEidIn(boidQuery, (eid) => {
      pos = setVec2FromComp(pos, TilePositionComponent, eid)
      velocity = setVec2FromComp(velocity, BoidComponent.velocity, eid)
      const tickVel = toTickVelocity(velocity, delta)
      const boidsInRange = this._findOthersInRange(eid, pos, perception)

      // align
      const alignVec = this._align(velocity, boidsInRange)

      // apply vectors
      pos.add(tickVel)
      addComponent(this.world, TileMoveComponent, eid)
      TileMoveComponent.x[eid] = pos.x
      TileMoveComponent.y[eid] = pos.y
      // User alignVec as acceleration
      // TODO limit velocity
      velocity.add(alignVec).limit(MAX_SPEED)
      BoidComponent.velocity.x[eid] = velocity.x
      BoidComponent.velocity.y[eid] = velocity.y
    })
  }

  _align(velocity: Vector2, boidsInRange: Client[]) {
    let steering = new Phaser.Math.Vector2()
    let total = 0
    boidsInRange.forEach((client) => {
      const clientPos = newVec2FromComp(TilePositionComponent, client.eid)
      steering.add(clientPos)
      total++
    })
    if (total > 0) {
      steering.scale(1.0 / total)
      steering.subtract(velocity)
    }
    return steering
  }

  _findOthersInRange(eid: number, pos: Vector2, range: number) {
    const clients =
      this.world.spatialWorld.spatialHashGrid?.FindNear(pos, [range * 2, range * 2]) ?? []
    return clients.filter((client) => client.eid !== eid && client.position.distance(pos) < range)
  }

  _attachComponentsToShooters() {
    // Add all the necessary components to a Shooter entity
    this.forEidIn(shooterPositionEnter, (eid) => {
      addComponent(this.world, SpatialComponent, eid)
      addComponent(this.world, BoidComponent, eid)

      BoidComponent.velocity.x[eid] = Math.random()
      BoidComponent.velocity.y[eid] = Math.random()
    })
  }
}

/** Converts the velocity to tick velocity */
export const toTickVelocity = (velocity: Vector2, delta: number) => {
  const v = velocity.clone()
  return v.scale(0.001 * delta)
}

export const fromTickVelocity = (tickVelocity: Vector2, delta: number) => {
  const v = tickVelocity.clone()
  return v.scale(1000.0 / delta)
}

export const setVec2FromComp = (
  vectorToSet: Vector2,
  component: ComponentType<typeof Vector2Schema>,
  eid: number,
): Vector2 => {
  return vectorToSet.set(component.x[eid], component.y[eid])
}

export const newVec2FromComp = (
  component: ComponentType<typeof Vector2Schema>,
  eid: number,
): Vector2 => {
  return setVec2FromComp(new Phaser.Math.Vector2(), component, eid)
}
