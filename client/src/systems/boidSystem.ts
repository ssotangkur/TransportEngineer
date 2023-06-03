import { ComponentType, IWorld, addComponent, defineQuery, enterQuery, exitQuery } from 'bitecs'
import { SpatialWorld } from './spatialSystem'
import { BaseSystem } from './baseSystem'
import { BoidComponent } from 'src/components/boidComponent'
import {
  AccelerationSumComponent,
  MoveableComponent,
  SpatialComponent,
  TileMoveComponent,
  TilePositionComponent,
  VelocityComponent,
} from 'src/components/positionComponent'
import { Client } from 'src/utils/spatialHashGrid/spatialHashGrid'
import {
  addAcceleration,
  newVec2FromComp,
  setCompFromVec2,
  setVec2FromComp,
  sumCompFromVec2,
} from 'src/utils/vectors'

const perceptionDistance = 3
const separationDistance = 0.5

export const boidQuery = defineQuery([
  BoidComponent,
  TilePositionComponent,
  VelocityComponent,
  AccelerationSumComponent,
  MoveableComponent,
])
const boidEnter = enterQuery(boidQuery)

type Vector2 = Phaser.Math.Vector2

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

    const toTickCoeff = 0.001 * delta

    const fromTickCoeff = 1000.0 / delta

    this.forEidIn(boidQuery, (eid) => {
      const maxAccel = MoveableComponent.maxAcceleration[eid] * toTickCoeff
      const maxSpeed = MoveableComponent.maxSpeed[eid] * toTickCoeff
      pos = setVec2FromComp(pos, TilePositionComponent, eid)

      velocity = setVec2FromComp(velocity, VelocityComponent, eid)
      // Velocities are stored as tiles/sec but for simplicity
      // we convert all to tiles/tick
      velocity.scale(toTickCoeff)

      // const tickVel = toTickVelocity(velocity, delta)
      const boidsInRange = this._findOthersInRange(eid, pos, perceptionDistance)

      const boidsTooClose = this._findOthersInRange(eid, pos, separationDistance)

      // steering vectors are acceleration
      const alignVec = this._align(velocity, toTickCoeff, maxSpeed, boidsInRange)
      // const cohesionVec = this._cohesion(pos, velocity, maxSpeed, boidsInRange)
      const separationVec = this._separation(pos, velocity, maxSpeed, boidsTooClose)
      const stayInVec = this._stayInBounds(pos)
      // cohesionVec.limit(maxAccel)
      // separationVec.limit(maxAccel)

      // combine vectors here
      const accel = new Phaser.Math.Vector2()
      accel.add(alignVec)
      // accel.add(cohesionVec)
      accel.add(separationVec)
      accel.add(stayInVec)

      // limit to max_accel
      accel.limit(maxAccel)

      // scale back to per sec^2 unit
      accel.scale(fromTickCoeff)
      // sum the accel component
      addAcceleration(accel, eid)
    })
  }

  _align(velocity: Vector2, toTickCoeff: number, maxSpeed: number, boidsInRange: Client[]) {
    let steering = new Phaser.Math.Vector2()
    let total = 0
    boidsInRange.forEach((client) => {
      const clientVelocity = newVec2FromComp(VelocityComponent, client.eid)
      // convert to tick velocity
      clientVelocity.scale(toTickCoeff)
      steering.add(clientVelocity)
      total++
    })
    if (total > 0) {
      steering.scale(1.0 / total)

      // The following to keep them moving
      // steering.normalize()
      // steering.scale(maxSpeed)

      steering.subtract(velocity)
    }

    return steering
  }

  _cohesion(position: Vector2, velocity: Vector2, maxSpeed: number, boidsInRange: Client[]) {
    let steering = new Phaser.Math.Vector2()
    let total = 0
    boidsInRange.forEach((client) => {
      const clientPos = newVec2FromComp(TilePositionComponent, client.eid)
      steering.add(clientPos)
      total++
    })
    if (total > 0) {
      steering.scale(1.0 / total)
      steering.subtract(position)

      // steering is now the velocity we wish we could do in
      // one tick, but we must limit it to the maxSpeed allowed
      steering.limit(maxSpeed)

      // At this point we just have a vector representing the distance
      // we want to cover in one timestep (delta), i.e. a dX/dT. Since we
      // already have an existing velocity, the acceleration we need for this
      // tick is steering -  (current dX/dT) which is the tickVelocity
      steering.subtract(velocity)
    }
    return steering
  }

  _separation(pos: Vector2, velocity: Vector2, maxSpeed: number, boidsTooClose: Client[]) {
    let steering = new Phaser.Math.Vector2()
    let total = 0
    boidsTooClose.forEach((other) => {
      const otherPos = newVec2FromComp(TilePositionComponent, other.eid)
      const dir = pos.clone()
      // Dir we want to go is away from client
      dir.subtract(otherPos)
      // Magnitude is how far the client is to the separation radius
      const mag = separationDistance - dir.length()
      // Scale the dir by the mag we just calculated
      dir.normalize().scale(mag)
      // Sum them all up
      steering.add(dir)
      total++
    })
    if (total == 0 || steering.length() == 0) {
      return steering
    }

    steering.scale(1.0 / total)

    // steering.subtract(pos)

    // At this point we just have a vector representing the distance
    // we want to cover in one timestep (delta), i.e. a dX/dT. Since we
    // already have an existing velocity, the acceleration we need for this
    // tick is steering -  (current dX/dT) which is the tickVelocity
    steering.subtract(velocity)

    return steering
  }

  _stayInBounds(pos: Vector2) {
    let steering = new Phaser.Math.Vector2()
    if (pos.x < 0) {
      steering.x = -pos.x
    }
    if (pos.x > 40) {
      steering.x = 40 - pos.x
    }
    if (pos.y < 0) {
      steering.y = -pos.y
    }
    if (pos.y > 40) {
      steering.y = 40 - pos.y
    }
    return steering
  }

  _findOthersInRange(eid: number, pos: Vector2, range: number) {
    const clients =
      this.world.spatialWorld.spatialHashGrid?.FindNear(pos, [range * 2, range * 2]) ?? []
    return clients.filter((client) => client.eid !== eid && client.position.distance(pos) < range)
  }

  _attachComponentsToShooters() {
    // Add all the necessary components to a Boid entity
    this.forEidIn(boidEnter, (eid) => {
      addComponent(this.world, SpatialComponent, eid)
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
