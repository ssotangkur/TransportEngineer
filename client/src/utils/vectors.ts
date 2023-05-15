import { ComponentType } from 'bitecs'
import {
  AccelerationSumComponent,
  Vector2 as Vector2Schema,
} from 'src/components/positionComponent'

export const randomVector = (magnitude: number = 1) => {
  const x = Math.random() - 0.5
  const y = Math.random() - 0.5
  const result = new Phaser.Math.Vector2(x, y).normalize()
  if (magnitude !== 1) {
    result.scale(magnitude)
  }
  return result
}

type Vector2 = Phaser.Math.Vector2

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

export const setCompFromVec2 = (
  component: ComponentType<typeof Vector2Schema>,
  eid: number,
  vector: Vector2,
) => {
  component.x[eid] = vector.x
  component.y[eid] = vector.y
}

export const sumCompFromVec2 = (
  component: ComponentType<typeof Vector2Schema>,
  eid: number,
  vector: Vector2,
) => {
  component.x[eid] += vector.x
  component.y[eid] += vector.y
}

/**
 * Special utility to add acceleration (and count)
 * @param accel
 * @param eid
 */
export const addAcceleration = (accel: Vector2, eid: number) => {
  sumCompFromVec2(AccelerationSumComponent.acceleration, eid, accel)
  AccelerationSumComponent.count[eid]++
}
