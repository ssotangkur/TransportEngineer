export type TileSetInfo = {
  tileSetImage: string
  tileSetName: string
  tileHeight: number
  tileWidth: number
  tileMargin: number
  tileSpacing: number
  firstGid: number
  layers: TiledJson['layers']
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
  tilesets: {
    margin: number
    spacing: number
    name: string
    image: string
    firstgid: number
    tileheight: number
    tilewidth: number
    tilecount: number
  }[]
}

export const parseTiledJson = async (tiledJsonPath: string): Promise<TileSetInfo> => {
  const resp = await fetch(tiledJsonPath)
  const tiledJson: TiledJson = await resp.json()

  // Only support one tileset for now
  const tileSet = tiledJson.tilesets[0]

  return {
    firstGid: tileSet.firstgid,
    tileSetImage: tileSet.image,
    tileSetName: tileSet.name,
    tileHeight: tileSet.tileheight,
    tileWidth: tileSet.tilewidth,
    tileMargin: tileSet.margin,
    tileSpacing: tileSet.spacing,
    layers: tiledJson.layers,
  }
}

export const convert1DTo2DArray = (data: number[], width: number, height: number): number[][] => {
  const result = []
  for (let i = 0; i < height; i++) {
    result.push(data.slice(i * width, (i + 1) * width))
  }
  return result
}
