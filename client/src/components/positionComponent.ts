import { Types, defineComponent } from 'bitecs'

export const TilePositionComponent = defineComponent({
  x: Types.f32,
  y: Types.f32,
})

export const WorldPositionComponent = defineComponent({
  x: Types.f32,
  y: Types.f32,
})
