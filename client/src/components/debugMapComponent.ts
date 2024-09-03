import { defineComponent, Types } from 'bitecs'

export const DebugMapMode = {
  Off: 0,
  HeightMap: 1,
  PrecipitationMap: 2,
  TemperatureMap: 3,
} as const

export const DebugMapComponent = defineComponent({
  mode: Types.ui8,
})

export const next = (mode: number) => {
  return (mode + 1) % Object.values(DebugMapMode).length
}
