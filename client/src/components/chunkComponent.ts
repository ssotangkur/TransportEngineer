import { defineComponent, Types } from 'bitecs'

export const ChunkComponent = defineComponent({
  x: Types.i16, // The chunk's column
  y: Types.i16, // The chunk's row
})
