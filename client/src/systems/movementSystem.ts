import { IWorld, defineQuery, removeComponent } from 'bitecs'
import { BaseSystem } from './baseSystem'
import {
  AccelerationSumComponent,
  TileMoveComponent,
  TilePositionComponent,
  VelocityComponent,
} from 'src/components/positionComponent'
import { setCompFromVec2, setVec2FromComp, sumCompFromVec2 } from 'src/utils/vectors'

export const movePositionQuery = defineQuery([TileMoveComponent, TilePositionComponent])
export const avpQuery = defineQuery([
  AccelerationSumComponent,
  VelocityComponent,
  TilePositionComponent,
])

export const MIN_VELOCITY_THRESHOLD = 0.1
export const MIN_VELOCITY_SQ = MIN_VELOCITY_THRESHOLD * MIN_VELOCITY_THRESHOLD

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
  }

  /**
   * Handles moves using combined accelerations
   */
  _resolveAccelerations(delta: number) {
    const toTickCoeff = 0.001 * delta
    let accel = new Phaser.Math.Vector2()
    let velocity = new Phaser.Math.Vector2()
    this.forEidIn(avpQuery, (eid) => {
      const total = AccelerationSumComponent.count[eid]
      if (total === 0) {
        return
      }

      accel = setVec2FromComp(accel, AccelerationSumComponent.acceleration, eid)
      accel.scale(1.0 / total)

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

      // Cleanup accel component for next round
      AccelerationSumComponent.acceleration.x[eid] = 0
      AccelerationSumComponent.acceleration.y[eid] = 0
      AccelerationSumComponent.count[eid] = 0
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
