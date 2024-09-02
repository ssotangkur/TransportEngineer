import _ from 'lodash'
import { makeNoise2D } from 'open-simplex-noise'
import { MultiLayerTile, TileLayer } from './multiLayerTile'
import { TileSetInfo } from './tiledJsonParser'

const OCTAVES = 4
const DECAY_COEFF = 0.5
const BASE_COORD_SCALE = 0.02

export const createHeightMap = (
  width: number,
  height: number,
  seedFnOrValue: number | (() => number) = () => Date.now(),
): number[][] => {
  const seed = _.isFunction(seedFnOrValue) ? seedFnOrValue() : seedFnOrValue
  const noise2d = makeNoise2D(seed)

  const octaveNoise = createOctaveNoiseFn(BASE_COORD_SCALE, OCTAVES, DECAY_COEFF, noise2d)

  const result: number[][] = []

  for (let y = 0; y < height; y++) {
    const row: number[] = new Array(width)
    for (let x = 0; x < width; x++) {
      row[x] = octaveNoise(x, y)
    }

    result.push(row)
  }

  return result
}

/**
 * Higher Order Function to create and combine multiple
 * octaves of the same noise function.
 */
export const createOctaveNoiseFn = (
  baseCoordScale: number,
  octaves: number,
  decayCoeff: number,
  noiseFn: (x: number, y: number) => number,
) => {
  return (x: number, y: number): number => {
    let octaveCoeff = 1
    let intensityCoeff = 1
    let sum = 0

    for (let o = 0; o < octaves; o++) {
      let noiseX = x * baseCoordScale * octaveCoeff
      let noiseY = y * baseCoordScale * octaveCoeff

      sum += noiseFn(noiseX, noiseY) * intensityCoeff

      // Instead of using Math.pow() which is slow, incrementally calc the coeffs
      octaveCoeff *= 2
      intensityCoeff *= decayCoeff
    }

    return sum
  }
}

/**
 * This mutates the array
 * @param data
 */
export const normalize2DArray = (data: number[][]) => {
  let min = data[0][0] ?? 0
  let max = data[0][0] ?? 0

  const height = data.length
  if (!height) {
    return
  }

  const width = data[0].length

  for (let r = 0; r < height; r++) {
    min = Math.min(min, ...data[r])
    max = Math.max(max, ...data[r])
  }
  const scale = 1 / (max - min)

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      data[r][c] = (data[r][c] - min) * scale
    }
  }
}

export const generateMapDataUsingNoise = (
  width: number,
  height: number,
  tileSetInfo: TileSetInfo,
) => {
  // Add +1 to width & height for marching squares
  const hData = createHeightMap(width + 1, height + 1)

  normalize2DArray(hData)

  // convert height map to "WangColor" map
  const colorMapper = createColorMapper(tileSetInfo)
  const colorMap = hData.map((row) => {
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

  return mlTileMap
}

export type WangColor = {
  color: string
  name: string
  probability: number
  id: number // Tiled uses index order as the id in their wang tile definitions
  representativeTileId: number
  minHeight: number
  rank: number // The relative rank height where 0 is the lowest, 1 is next highest, and so on
}

const createColorMapper = (tilesetInfo: TileSetInfo) => {
  return (height: number): WangColor => {
    const rankInfo = tilesetInfo.colorInfo.getRankForHeight(height)
    return rankInfo.getColorForBiome()
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
