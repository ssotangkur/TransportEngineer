import { IWorld, addComponent, defineQuery, enterQuery } from 'bitecs'
import { SpatialWorld } from './spatialSystem'
import { BaseSystem } from './baseSystem'
import { BoidComponent } from 'src/components/boidComponent'
import {
  AccelerationSumComponent,
  MoveableComponent,
  SpatialComponent,
  TilePositionComponent,
  VelocityComponent,
} from 'src/components/positionComponent'
import { addAcceleration, newVec2FromComp, setVec2FromComp } from 'src/utils/vectors'
import { aabbByCenter } from 'src/utils/aabb'
import { MapWorld } from './mapSystem'
import { PlayerComponent } from 'src/components/playerComponent'

const COHESION_WEIGHT = 0.0
const ALIGNMENT_WEIGHT = 0.1
const SEPARATION_WEIGHT = 1.0
const BOUNDS_WEIGHT = 0.1
const PREDATOR_WEIGHT = 3.0

const PREDATOR_DISTANCE = 4
const perceptionDistance = 5
const separationDistance = 2

const BOUNDS_SIZE = 40

export const boidQuery = defineQuery([
  BoidComponent,
  TilePositionComponent,
  VelocityComponent,
  AccelerationSumComponent,
  MoveableComponent,
])
const boidEnter = enterQuery(boidQuery)

// Player will be the predator
const playerQuery = defineQuery([PlayerComponent, TilePositionComponent])

type Vector2 = Phaser.Math.Vector2

export type Client = {
  eid: number
  position: Phaser.Math.Vector2
}

export class BoidSystem<WorldIn extends SpatialWorld & MapWorld> extends BaseSystem<
  SpatialWorld & MapWorld,
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

    let predatorEid = -1
    this.forEidIn(playerQuery, (eid) => {
      predatorEid = eid
    }) // should only be one

    this.forEidIn(boidQuery, (eid) => {
      // const maxAccel = MoveableComponent.maxAcceleration[eid] * toTickCoeff
      // const maxSpeed = MoveableComponent.maxSpeed[eid] * toTickCoeff
      const maxAccel = MoveableComponent.maxAcceleration[eid]
      const maxSpeed = MoveableComponent.maxSpeed[eid]
      pos = setVec2FromComp(pos, TilePositionComponent, eid)

      velocity = setVec2FromComp(velocity, VelocityComponent, eid)
      // Velocities are stored as tiles/sec but for simplicity
      // we convert all to tiles/tick
      velocity.scale(toTickCoeff)

      // const tickVel = toTickVelocity(velocity, delta)
      const boidsInRange = this._findOthersInRange(eid, pos, perceptionDistance)

      const boidsTooClose = this._findOthersInRange(eid, pos, separationDistance)

      // steering vectors are acceleration
      const alignVec = this._align(velocity, maxSpeed, boidsInRange).scale(ALIGNMENT_WEIGHT)
      const cohesionVec = this._cohesion(pos, velocity, maxSpeed, boidsInRange).scale(
        COHESION_WEIGHT,
      )
      const separationVec = this._separation(pos, velocity, maxSpeed, boidsTooClose).scale(
        SEPARATION_WEIGHT,
      )
      const stayInVec = this._stayInBounds(pos, maxSpeed).scale(BOUNDS_WEIGHT)

      const predatorPos = newVec2FromComp(TilePositionComponent, predatorEid)
      const predatorVec = this._avoidPredator(predatorPos, pos, velocity, maxSpeed).scale(
        PREDATOR_WEIGHT,
      )
      // cohesionVec.limit(maxAccel)
      // separationVec.limit(maxAccel)

      // combine vectors here
      const accel = new Phaser.Math.Vector2()
      accel.add(alignVec)
      accel.add(cohesionVec)
      accel.add(separationVec)
      accel.add(stayInVec)
      accel.add(predatorVec)

      // limit to max_accel
      accel.limit(maxAccel)

      // scale back to per sec^2 unit
      accel.scale(fromTickCoeff)
      // sum the accel component
      addAcceleration(accel, eid)
    })
  }

  _align(velocity: Vector2, maxSpeed: number, boidsInRange: Client[]) {
    let steering = new Phaser.Math.Vector2()
    let total = 0
    boidsInRange.forEach((client) => {
      const clientVelocity = newVec2FromComp(VelocityComponent, client.eid)
      steering.add(clientVelocity)
      total++
    })
    if (total > 0) {
      steering.scale(1.0 / total)

      // The following to keep them moving
      steering.normalize()
      steering.scale(maxSpeed)

      steering.subtract(velocity)
    } else {
      // continue going in same direction at max speed
      steering.setFromObject(velocity).normalize().scale(maxSpeed)
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

      steering.normalize()

      // steering is now the velocity we wish we could do in
      // one tick, but we must limit it to the maxSpeed allowed
      steering.scale(maxSpeed)

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

      // Inverersly proportional to distance
      dir.scale(1 / dir.length())
      // Sum them all up
      steering.add(dir)
      total++
    })
    if (total == 0 || steering.length() == 0) {
      return steering
    }

    // steering.scale(SEPARATION_WEIGHT / total)

    steering.scale(1.0 / total)
    // steering.subtract(pos)
    //steering.normalize()
    steering.scale(maxSpeed)

    // At this point we just have a vector representing the distance
    // we want to cover in one timestep (delta), i.e. a dX/dT. Since we
    // already have an existing velocity, the acceleration we need for this
    // tick is steering -  (current dX/dT) which is the tickVelocity
    steering.subtract(velocity)

    return steering
  }

  _avoidPredator(predatorPos: Vector2, pos: Vector2, velocity: Vector2, maxSpeed: number) {
    let steering = new Phaser.Math.Vector2()

    if (predatorPos.distance(pos) < PREDATOR_DISTANCE) {
      steering = pos.clone()
      steering.subtract(predatorPos)
      steering.normalize()
      steering.scale(maxSpeed)
      steering.subtract(velocity)
    }

    return steering
  }

  _stayInBounds(pos: Vector2, maxSpeed: number) {
    let steering = new Phaser.Math.Vector2()
    if (pos.x < 0) {
      steering.x = -pos.x
    }
    if (pos.x > BOUNDS_SIZE) {
      steering.x = BOUNDS_SIZE - pos.x
    }
    if (pos.y < 0) {
      steering.y = -pos.y
    }
    if (pos.y > BOUNDS_SIZE) {
      steering.y = BOUNDS_SIZE - pos.y
    }
    // steering.normalize()
    //steering.limit(maxSpeed * BOUNDS_WEIGHT)
    //steering.scale(BOUNDS_WEIGHT)
    return steering
  }

  // Temp Vec2 to avoid gc
  private otherPos = new Phaser.Math.Vector2()

  _findOthersInRange(eid: number, pos: Vector2, range: number): Client[] {
    const foundEids = new Set<number>()

    // Spatial queries are always in World coordinates
    const worldPos = this.world.mapSystem.mapInfo.tileToWorldXY(pos.x, pos.y)
    const worldRange2X = this.world.mapSystem.mapInfo.tileToWorldX(range * 2)
    this.world.spatialWorld.spatialStruct.find(
      aabbByCenter(worldPos.x, worldPos.y, worldRange2X, worldRange2X),
      foundEids,
    )

    return Array.from(foundEids)
      .filter((foundEid) => {
        if (eid === foundEid) {
          return false
        }
        setVec2FromComp(this.otherPos, TilePositionComponent, foundEid)
        return pos.distance(this.otherPos) < range
      })
      .map((foundEid) => {
        return {
          eid: foundEid,
          position: newVec2FromComp(TilePositionComponent, foundEid),
        }
      })
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
