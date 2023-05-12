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
 * speed is in Tiles/second
 */
export const SpeedComponent = defineComponent({ speed: Types.f32 })

/**
 * Entity can rotate
 */
export const AngleComponent = defineComponent({ radians: Types.f32 })

export const SpatialComponent = defineComponent()
