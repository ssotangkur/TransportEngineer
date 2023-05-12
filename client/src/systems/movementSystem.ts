import { IWorld, defineQuery, removeComponent } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { TileMoveComponent, TilePositionComponent } from 'src/components/positionComponent'

export const movePositionQuery = defineQuery([TileMoveComponent, TilePositionComponent])

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

  update(_time: number, _delta: number): void {
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
