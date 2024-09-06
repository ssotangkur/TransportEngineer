import { Biome, BiomeCell, createBiomeMap } from './biome'
import { MultiLayerTile, TileLayer } from './multiLayerTile'
import { TileSetInfo } from './tiledJsonParser'

export type MapInfo = {
  width: number
  height: number
  biomeMap: BiomeCell[][]
  multiLayerMap: MultiLayerTile[][]
}

export const generateMapDataUsingNoise = (
  width: number,
  height: number,
  tileSetInfo: TileSetInfo,
): MapInfo => {
  // Add +1 to width & height for marching squares
  const biomeMap = createBiomeMap(width + 1, height + 1)

  // convert height map to "WangColor" map
  const colorMapper = createColorMapper(tileSetInfo)
  const colorMap = biomeMap.map((row) => {
    return row.map(colorMapper)
  })

  // From the color map, we use marching squares to find the correct tiles for each layer
  const wangTileMapper = createWangTileMapper(tileSetInfo)
  const mlTileMap: MultiLayerTile[][] = []
  for (let r = 0; r < height; r++) {
    const row: MultiLayerTile[] = []
    for (let c = 0; c < width; c++) {
      const tl = colorMap[r][c]
      const tr = colorMap[r][c + 1]
      const bl = colorMap[r + 1][c]
      const br = colorMap[r + 1][c + 1]

      row.push(wangTileMapper(tr, br, bl, tl))
    }
    mlTileMap.push(row)
  }

  return {
    biomeMap,
    multiLayerMap: mlTileMap,
    width,
    height,
  }
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

const createColorMapper = (tilesetInfo: TileSetInfo) => {
  return (biomeCell: BiomeCell): WangColor => {
    const rankInfo = tilesetInfo.colorInfo.getRankForHeightAndBiome(
      biomeCell.height,
      biomeCell.biome,
    )
    return rankInfo.getColorForBiome(biomeCell.biome)
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
    const colorForRank: Record<number, WangColor> = {
      [colors[0].rank]: tr,
      [colors[1].rank]: br,
      [colors[2].rank]: bl,
      [colors[3].rank]: tl,
    }
    const min = Math.min(...ranks)
    const max = Math.max(...ranks)

    const results: TileLayer[] = []

    // See if there's an optimized tile with all 4 colors
    const optimalKey = keyForColors(colors)
    const tileId = tilesetInfo.colorInfo.getTileForKey(optimalKey)
    if (tileId) {
      results.push({ rank: max, tileId, color: colorForRank[max] })
      return { layers: results }
    }

    // start at min layer with all 4 colors same
    let mask: [boolean, boolean, boolean, boolean] = [true, true, true, true]
    for (let rank = min; rank <= max; rank++) {
      const rankColor = colorForRank[rank]
      if (!rankColor) {
        continue // skip if no color
      }
      const colorsForLayer = mask.map((isMasked) => {
        return isMasked ? rankColor : undefined
      }) as OptionalWangColor4
      const key = keyForColors(colorsForLayer)
      const tileId = tilesetInfo.colorInfo.getTileForKey(key)
      if (!tileId) {
        throw new Error(`Could not find tile for colors ${key}`)
      }

      // find corner that is too low for next rank and set it's mask to false
      let maskChanged = false
      for (let i = 0; i < 4; i++) {
        if (ranks[i] === rank) {
          mask[i] = false
          maskChanged = true
        }
      }

      // only push if mask changed so we don't push colors that were skipped
      if (maskChanged) {
        results.push({ rank, tileId, color: colorForRank[rank] })
      }
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
