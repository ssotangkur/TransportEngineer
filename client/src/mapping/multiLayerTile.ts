import { WangColor } from './noiseGeneratedMap'

export type MultiLayerTile = {
  layers: TileLayer[]
}

export type TileLayer = {
  rank: number
  tileId: number
  color: WangColor
}
