import { groupBy } from 'src/utils/groupBy'
import { Biome, BiomeCell } from './biome'
import { MultiLayerTile, TileLayer } from './multiLayerTile'
import { TileSetInfo } from './tiledJsonParser'

export type MapInfo = {
  width: number
  height: number
  multiLayerMap: MultiLayerTile[][]
}

export const generateMapDataUsingNoise = (
  width: number,
  height: number,
  tileSetInfo: TileSetInfo,
  colorMap: (x: number, y: number) => WangColor,
): MapInfo => {
  // From the color map, we use marching squares to find the correct tiles for each layer
  const wangTileMapper = createWangTileMapper(tileSetInfo)
  const mlTileMap: MultiLayerTile[][] = []
  for (let y = 0; y < height; y++) {
    const row: MultiLayerTile[] = []
    for (let x = 0; x < width; x++) {
      const tl = colorMap(x, y)
      const tr = colorMap(x + 1, y)
      const bl = colorMap(x, y + 1)
      const br = colorMap(x + 1, y + 1)

      row.push(wangTileMapper(tr, br, bl, tl))
    }
    mlTileMap.push(row)
  }

  return {
    multiLayerMap: mlTileMap,
    width,
    height,
  }
}

export const createMultiLayerMap = (
  tileSetInfo: TileSetInfo,
  colorMap: (x: number, y: number) => WangColor,
): ((x: number, y: number) => MultiLayerTile) => {
  // From the color map, we use marching squares to find the correct tiles for each layer
  const wangTileMapper = createWangTileMapper(tileSetInfo)

  const mapper = (x: number, y: number): MultiLayerTile => {
    const tl = colorMap(x, y)
    const tr = colorMap(x + 1, y)
    const bl = colorMap(x, y + 1)
    const br = colorMap(x + 1, y + 1)
    return wangTileMapper(tr, br, bl, tl)
  }

  return mapper
}

export type WangColor = {
  color: string
  name: string
  probability: number
  id: number // Tiled uses index order as the id in their wang tile definitions
  representativeTileId: number
  minHeight: number
  rank: number // The relative rank height where 0 is the lowest, 1 is next highest, and so on
  biomes: Biome[]
}

export const createColorMapper = (
  tilesetInfo: TileSetInfo,
  biomeMap: (x: number, y: number) => BiomeCell,
) => {
  return (x: number, y: number): WangColor => {
    const biomeCell = biomeMap(x, y)
    const rankInfo = tilesetInfo.colorInfo.getRankForHeightAndBiome(
      biomeCell.height,
      biomeCell.biome,
    )
    return rankInfo.getColor()
  }
}

/**
 * To make finding a specific wangtile easier, make a composite key
 * Format
 *    <TR>:<BR>:<BL>:<TL>
 *
 * where <TR> = Top Right Id, <BL> = Bottom Left Id, etc
 *
 */
const createWangTileMapper = (tilesetInfo: TileSetInfo) => {
  const wangTileMapper = (
    tr: WangColor,
    br: WangColor,
    bl: WangColor,
    tl: WangColor,
  ): MultiLayerTile => {
    const colors: WangColor4 = [tr, br, bl, tl]
    const ranks = colors.map((c) => c.rank)
    const colorsForRank: Map<number, WangColor[]> = groupBy(colors, (c) => c.rank)

    const min = Math.min(...ranks)
    const max = Math.max(...ranks)

    const results: TileLayer[] = []

    // See if there's an optimized tile with all 4 colors
    const optimalKey = keyForColors(colors)
    const tileId = tilesetInfo.colorInfo.getTileForKey(optimalKey)
    if (tileId) {
      results.push({ rank: max, tileId, color: colorsForRank.get(max)![0] })
      return { layers: results }
    }

    // start at min rank, for each rank
    let mask: [boolean, boolean, boolean, boolean] = [true, true, true, true]
    for (let rank = min; rank <= max; rank++) {
      const rankColors = colorsForRank.get(rank) ?? []
      if (rankColors.length === 0) {
        continue // skip if no color
      }
      rankColors.forEach((rankColor, indexInRank) => {
        // Find the tile just for this color
        const colorSeq = colors.map((c, index) => {
          if (c === rankColor) {
            mask[index] = false // Mark this color as used
            return c
          }
          return undefined
        }) as OptionalWangColor4

        // On the bottom layer (to cover any gaps) we must populate all 4 corners
        // Last color in rank fills out whatever corners are missing
        if (rank === min && indexInRank === rankColors.length - 1) {
          mask.forEach((isMasked, index) => {
            if (isMasked) {
              colorSeq[index] = rankColor
            }
          })
        }
        const key = keyForColors(colorSeq)
        const tileId = tilesetInfo.colorInfo.getTileForKey(key)
        if (!tileId) {
          throw new Error(`Could not find tile for colors ${key}`)
        }
        results.push({ rank, tileId, color: rankColor })
      })
    }
    return { layers: results }
  }
  return wangTileMapper
}

type WangColor4 = [WangColor, WangColor, WangColor, WangColor]
type OptionalWangColor4 = [
  WangColor | undefined,
  WangColor | undefined,
  WangColor | undefined,
  WangColor | undefined,
]

const keyForColors = ([tr, br, bl, tl]: OptionalWangColor4) => {
  const trId = tr ? tr.id : 0
  const brId = br ? br.id : 0
  const blId = bl ? bl.id : 0
  const tlId = tl ? tl.id : 0

  return `${trId}:${brId}:${blId}:${tlId}`
}
