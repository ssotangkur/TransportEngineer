import { addComponent, addEntity } from 'bitecs'
import { WorldPositionComponent } from 'src/components/positionComponent'
import { SpriteComponent } from 'src/components/spriteComponent'

export const addEntityAt = (
  world: any,
  x: number,
  y: number,
  width?: number,
  height?: number,
): number => {
  const eid = addEntity(world)

  addComponent(world, WorldPositionComponent, eid)
  WorldPositionComponent.x[eid] = x
  WorldPositionComponent.y[eid] = y

  if (width !== undefined && height !== undefined) {
    addComponent(world, SpriteComponent, eid)
    SpriteComponent.width[eid] = width ?? 1
    SpriteComponent.height[eid] = height ?? 1
  }
  return eid
}

export const moveEntity = (eid: number, x: number, y: number) => {
  WorldPositionComponent.x[eid] = x
  WorldPositionComponent.y[eid] = y
}
