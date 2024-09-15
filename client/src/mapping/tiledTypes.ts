export type TiledProperty = {
  name: string
} & (
  | {
      type: 'string' | 'color' | 'file'
      value: string
    }
  | {
      type: 'int' | 'float'
      value: number
    }
  | {
      type: 'bool'
      value: boolean
    }
  | {
      type: 'object' | 'class'
      value: any
    }
)

export type TiledTileJson = {
  id: number
  image?: string
  imageheight?: number
  imagewidth?: number
  probability?: number
  properties?: TiledProperty[]
}

export type TiledWangColorJson = {
  color: string
  name: string
  probability: number
  tile: number
  properties?: TiledProperty[]
}

export type TiledWangSetJson = {
  colors: TiledWangColorJson[]
  name: string
  type: string
  wangtiles?: {
    tileid: number
    wangid: [number, number, number, number, number, number, number, number]
  }[]
}

/**
 * Type for parsing Tiled JSON files
 */
export type TiledTileSetJson = {
  margin: number
  spacing: number
  name: string
  image: string
  firstgid: number
  tileheight: number
  tilewidth: number
  tilecount: number
  tiles?: TiledTileJson[]
  type: string
  version: string
  wangsets?: TiledWangSetJson[]
}

/**
 * Type for parsing Tiled JSON files
 */
export type TiledJson = {
  layers: {
    data: number[]
    height: number
    width: number
    name: string
    id: number
  }[]
  tilesets: TiledTileSetJson[]
}
