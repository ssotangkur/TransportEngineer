import { defineComponent } from 'bitecs'
import { Vector2 } from './positionComponent'

export const BoidComponent = defineComponent({
  velocity: Vector2,
})
