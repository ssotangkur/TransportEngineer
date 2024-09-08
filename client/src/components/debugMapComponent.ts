import { defineComponent, Types } from 'bitecs'

export const DebugMapMode = {
  Off: 0,
  HeightMap: 1,
  PrecipitationMap: 2,
  TemperatureMap: 3,
  Biome: 4,
} as const

export type DebugMapModes = (typeof DebugMapMode)[keyof typeof DebugMapMode]

export const DebugMapComponent = defineComponent({
  mode: Types.ui8,
})

export const next = (mode: number) => {
  return (mode + 1) % Object.values(DebugMapMode).length
}
