import { WangColor } from './mapGenerator'

export type MultiLayerTile = {
  layers: TileLayer[]
}

export type TileLayer = {
  rank: number
  tileId: number
  color: WangColor
}
