import { Types, defineComponent } from 'bitecs'

export const SpriteComponent = defineComponent({
  spriteKey: Types.ui8,
  spriteId: Types.ui8,
  width: Types.ui16, // in World units, not tile units
  height: Types.ui16, // in World units, not tile units
})
