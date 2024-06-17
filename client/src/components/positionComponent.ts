import { Types, defineComponent } from 'bitecs'

export const Vector2 = {
  x: Types.f32,
  y: Types.f32,
}

export const TilePositionComponent = defineComponent(Vector2)

export const TileTargetComponent = defineComponent(Vector2)

export const TileMoveComponent = defineComponent(Vector2)

export const WorldPositionComponent = defineComponent(Vector2)

export const WorldTargetComponent = defineComponent(Vector2)

/**
 * Entity can move
 * speed is in tiles/second
 *
 * omega is angular velocity
 * alpha is angular acceleration
 */
export const MoveableComponent = defineComponent({
  maxSpeed: Types.f32,
  maxAcceleration: Types.f32,
  maxOmega: Types.f32,
  maxAlpha: Types.f32,
})

/**
 * Entity's current velocity in tiles/second
 */
export const VelocityComponent = defineComponent(Vector2)

/**
 * Entity can rotate in radians/sec, clockwise is positive
 */
export const AngularVelocityComponent = defineComponent({ w: Types.f32 })

/**
 * Entities can add accelerations (ie forces) to this component
 * Values are in tiles/second/second
 */
export const AccelerationSumComponent = defineComponent({
  acceleration: Vector2,
  count: Types.i16,
})

export const AccelerationComponent = defineComponent(Vector2)

/**
 * Entity can rotate
 */
export const AngleComponent = defineComponent({ 
  radians: Types.f32,
  desiredAngle: Types.f32,
 })

export const SpatialComponent = defineComponent()
