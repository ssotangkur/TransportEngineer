import {
  IWorld,
  addComponent,
  defineQuery,
  enterQuery,
  hasComponent,
  removeComponent,
} from 'bitecs'
import { BaseSystem } from './baseSystem'
import {
  AccelerationComponent,
  AccelerationSumComponent,
  AngleComponent,
  AngularVelocityComponent,
  TileMoveComponent,
  TilePositionComponent,
  VelocityComponent,
} from 'src/components/positionComponent'
import { setCompFromVec2, setVec2FromComp, sumCompFromVec2 } from 'src/utils/vectors'

export const MIN_VELOCITY_THRESHOLD = 0.1
export const MIN_VELOCITY_SQ = MIN_VELOCITY_THRESHOLD * MIN_VELOCITY_THRESHOLD
export const MAX_ALPHA = 2 * Math.PI // 360deg/s/s
export const MAX_ANGULAR_VELOCITY = 5 * 2 * Math.PI

/**
 * Resolves the AccelerationSumComponent into the AccelerationComponent
 */
export class AccelerationResolutionSystem<WorldIn extends IWorld> extends BaseSystem<
  IWorld,
  WorldIn,
  IWorld
> {
  private accelSumQuery = defineQuery([AccelerationSumComponent])
  private accelSumEnter = enterQuery(this.accelSumQuery)

  createWorld(): IWorld {
    return {}
  }
  update() {
    this.forEidIn(this.accelSumEnter, (eid) => {
      addComponent(this.world, AccelerationComponent, eid)
    })

    let accel = new Phaser.Math.Vector2()
    this.forEidIn(this.accelSumQuery, (eid) => {
      const total = AccelerationSumComponent.count[eid]
      if (total === 0) {
        AccelerationComponent.x[eid] = 0
        AccelerationComponent.y[eid] = 0
      } else {
        accel = setVec2FromComp(accel, AccelerationSumComponent.acceleration, eid)
        accel.scale(1.0 / total)
        setCompFromVec2(AccelerationComponent, eid, accel)
      }
      // Reset our sum component
      // Cleanup accel component for next round
      AccelerationSumComponent.acceleration.x[eid] = 0
      AccelerationSumComponent.acceleration.y[eid] = 0
      AccelerationSumComponent.count[eid] = 0
    })
  }
}

export const movePositionQuery = defineQuery([TileMoveComponent, TilePositionComponent])
export const avpQuery = defineQuery([
  AccelerationComponent,
  VelocityComponent,
  TilePositionComponent,
])
export const angleVelocityAccelQuery = defineQuery([
  AngleComponent,
  AngularVelocityComponent,
  AccelerationComponent,
])
/**
 * Takes MoveComponents and applies them to TilePositionComponents, removing the MoveComponent when it is done.
 * We do this so entities can declare where they want to move, but allow other systems like physics to adjust
 * where they will actually go.
 *
 * Do this after all moves are done, but before translating to WorldPositions
 */
export class MoveResolutionSystem<WorldIn extends IWorld> extends BaseSystem<
  IWorld,
  WorldIn,
  IWorld
> {
  createWorld(): IWorld {
    return {}
  }

  update(_time: number, delta: number): void {
    this._explictMoveUpdate()
    this._resolveAccelerations(delta)
    this._resolveAngularVelocity(delta)
  }

  /**
   * Handles moves using combined accelerations
   */
  _resolveAccelerations(delta: number) {
    const toTickCoeff = 0.001 * delta
    let accel = new Phaser.Math.Vector2()
    let velocity = new Phaser.Math.Vector2()
    this.forEidIn(avpQuery, (eid) => {
      accel = setVec2FromComp(accel, AccelerationComponent, eid)
      velocity = setVec2FromComp(velocity, VelocityComponent, eid)
      velocity.add(accel)

      // If we're moving very slowly just stop moving
      if (velocity.lengthSq() < MIN_VELOCITY_SQ) {
        velocity.set(0, 0)
      }

      // Save this velocity, before we convert to tick
      setCompFromVec2(VelocityComponent, eid, velocity)

      velocity.scale(toTickCoeff)

      // Add velocity to the position
      sumCompFromVec2(TilePositionComponent, eid, velocity)
    })
  }

  /**
   * Takes the desired direction and changes the angular velocity up to the max towards
   * that direction
   * @param delta
   * @param desiredAngleVec
   * @param eid
   * @param maxAlpha  Maximum angular acceleration in rads/tick/tick
   */
  _resolveAngularVelocity(delta: number) {
    const toTickCoeff = 0.001 * delta
    const maxAlpha = toTickCoeff * MAX_ALPHA
    const maxW = toTickCoeff * MAX_ANGULAR_VELOCITY
    let accel = new Phaser.Math.Vector2()

    this.forEidIn(angleVelocityAccelQuery, (eid) => {
      // We want to point the direction we're accelerating
      accel = setVec2FromComp(accel, VelocityComponent, eid)
      let desired = Phaser.Math.Angle.Wrap(accel.angle())
      let angle = AngleComponent.radians[eid]
      let angVelocity = AngularVelocityComponent.w[eid] * 0.001 * delta
      // alpha is the angular acceleration needed to turn to the desired angle
      // in 1 tick given the current angular velocity
      let alpha = desired - Phaser.Math.Angle.Wrap(angVelocity + angle)
      // alpha = Phaser.Math.Angle.Wrap(alpha)
      if (alpha > 0) {
        alpha = Math.min(maxAlpha, alpha)
      } else {
        alpha = Math.max(-maxAlpha, alpha)
      }
      angVelocity += alpha
      angVelocity = Phaser.Math.Clamp(angVelocity, -maxW, maxW)
      // TODO: Limit max angular velocity?
      angle += angVelocity
      AngleComponent.radians[eid] = Phaser.Math.Angle.Wrap(angle)
      AngularVelocityComponent.w[eid] = (angVelocity * 1000) / delta // Convert back to rads/sec
    })
  }

  /**
   * Handles moves that don't use physics
   * @param delta
   */
  _explictMoveUpdate() {
    this.forEidIn(movePositionQuery, (eid) => {
      TilePositionComponent.x[eid] = TileMoveComponent.x[eid]
      TilePositionComponent.y[eid] = TileMoveComponent.y[eid]
    })
  }
}

export const moveQuery = defineQuery([TileMoveComponent])

/**
 * This removes the MoveComponent from all entities
 * Do this near the end so that other systems will know if an entity has been moved during the turn
 */
export class MoveComponentRemovalSystem<WorldIn extends IWorld> extends BaseSystem<
  IWorld,
  WorldIn,
  IWorld
> {
  createWorld(): IWorld {
    return {}
  }

  update(_time: number, _delta: number): void {
    this.forEidIn(moveQuery, (eid) => {
      removeComponent(this.world, TileMoveComponent, eid)
    })
  }
}
