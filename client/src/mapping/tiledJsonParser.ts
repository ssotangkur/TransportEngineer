import { ASSETS_PATH } from 'src/constants'
import { OrchestratableScene } from 'src/scenes/orchestratableScene'
import { EquilavencyGroups } from './equilavencyGroup'
import { TiledTileSetJson, TiledWangColorJson, TiledWangSetJson } from './tiledTypes'
import _ from 'lodash'
import { groupBy } from 'src/utils/groupBy'
import { WangColor } from './mapGenerator'
import { ALL_BIOMES, Biome, isBiome } from './biome'
import { MultiLayerTile } from './multiLayerTile'

const TILES_PATH = ASSETS_PATH + '/tiles/lpc-terrains'
const TILE_SET_CACHE_ID = 'tileSetInfo'

/**
 * RankInfo's should be specific to a single biome.
 * All the colors in the rankInfo should be compatible with the same biome.
 */
export type RankInfo = {
  rank: number
  minHeight: number
  colors: WangColor[]
  getColor: () => WangColor
}

export type ColorInfo = {
  allColors: WangColor[] // In descending minHeight order
  ranksByBiome: Map<Biome, RankInfo[]>
  maxRank: number
  // Use keyForWangId to generate a key, randomly chooses tile base on probability
  getTileForKey: (key: string) => number | undefined
  getRankForHeightAndBiome: (height: number, biome: Biome) => RankInfo
}

export type TileSetInfo = {
  tileSetImage?: string
  tileSetName: string
  tileHeight: number
  tileWidth: number
  tileMargin: number
  tileSpacing: number
  firstGid: number

  /**
   * Tiles with the same equivalence group name can be used interchangeably.
   * We map tiles with the same equivalence group name to the same number.
   */
  equivalencyGroups: EquilavencyGroups

  colorInfo: ColorInfo

  tiledTileSetJson: TiledTileSetJson

  getTileInfo: (tileId: number) => TileInfo
}

export type TileInfo = {
  tileId: number
  probability: number
}

export type TileMap = {
  data: number[][]
  tileWidth: number
  tileHeight: number
}

export type TiledData = {
  tileSetInfo: TileSetInfo
  tileMap: TileMap
}

/**
 * Fetches and parses a Tiled JSON file and associated tileset image file.
 * The file must be located in the /assets/tiles directory.
 * Call this in the preload() method of a Phaser scene using the rexAwait loader.
 *
 * @param tiledTileSetJsonFile
 * @param scene
 * @returns
 */
export const loadTiledTileSetJson = async (
  tiledTileSetJsonFile: string,
  scene: Phaser.Scene,
): Promise<TileSetInfo> => {
  const resp = await fetch(TILES_PATH + '/' + tiledTileSetJsonFile)
  const tileSet: TiledTileSetJson = await resp.json()

  const { ranksByBiome, allColors } = parseRankInfos(tileSet.wangsets ?? [])

  const maxRank = Math.max(...allColors.map((c) => c.rank))

  const getTileInfo = createGetTileInfo(tileSet)

  const tileSetInfo: TileSetInfo = {
    firstGid: tileSet.firstgid,
    tileSetImage: tileSet.image,
    tileSetName: tileSet.name,
    tileHeight: tileSet.tileheight,
    tileWidth: tileSet.tilewidth,
    tileMargin: tileSet.margin,
    tileSpacing: tileSet.spacing,
    equivalencyGroups: new EquilavencyGroups(),

    colorInfo: {
      allColors,
      ranksByBiome,
      maxRank,
      getTileForKey: createGetTileForKey(tileSet, getTileInfo),
      getRankForHeightAndBiome: createGetRankForHeightAndBiome(ranksByBiome),
    },

    getTileInfo,

    tiledTileSetJson: tileSet,
  }
  // Compute equivalency groups
  if (tileSet.tiles) {
    tileSet.tiles.forEach((tile) => {
      const equivalenceGroup = tile.properties?.find((prop) => prop.name === 'equivalencyGroup')
      if (equivalenceGroup) {
        // Need to add firstgid so that these tile ids so match the tile ids in the map data
        tileSetInfo.equivalencyGroups.add(tile.id + tileSet.firstgid, equivalenceGroup.value)
      }
    })
  }

  loadImages(tileSetInfo, scene)

  return tileSetInfo
}

const createGetTileInfo = (tilesetJson: TiledTileSetJson) => {
  const tileInfos = new Map<number, TileInfo>()
  tilesetJson.tiles?.forEach((tile) => {
    tileInfos.set(tile.id, {
      tileId: tile.id,
      probability: tile.probability ?? 1,
    })
  })

  const getTileInfo = (tileId: number) => {
    let tileInfo = tileInfos.get(tileId)
    if (!tileInfo) {
      tileInfo = { tileId, probability: 1 }
      tileInfos.set(tileId, tileInfo)
    }
    return tileInfo
  }

  return getTileInfo
}

const createGetRankForHeightAndBiome = (ranksByBiome: Map<Biome, RankInfo[]>) => {
  return (height: number, biome: Biome): RankInfo => {
    const rankInfos = ranksByBiome.get(biome)
    if (!rankInfos) {
      throw new Error(`No rankInfos for biome ${biome}`)
    }
    for (let i = 0; i < rankInfos.length; i++) {
      const wangColor = rankInfos[i]
      if (height > wangColor.minHeight) {
        return wangColor
      }
    }
    return rankInfos[rankInfos.length - 1]
  }
}

type PartialWangColor = Omit<WangColor, 'rank'>

const isPartialWangColor = (color: any): color is PartialWangColor => {
  return color?.minHeight !== undefined
}

/**
 * Parses out the rankInfos from the wangsets in descending order
 * @param wangsets
 * @returns
 */
const parseRankInfos = (wangsets: TiledWangSetJson[]) => {
  const partialWangColors = wangsets?.flatMap((wangSet) => {
    return wangSet.colors
      .map((color, index) => jsonColorToWangColor(color, index)) // Need to convert first since id is based on initial index position
      .filter(isPartialWangColor) // Filter out colors that don't have minHeight
  })

  // Group colors that share the same minHeight
  const wangColorsByMinHeight = groupBy(partialWangColors, (wc) => wc.minHeight)
  const wangColorsWithRanks = Array.from(wangColorsByMinHeight.entries())
    .sort((a, b) => a[0] - b[0]) // sort ascending...
    .flatMap((tuple, index) => {
      // so we can add "rank" completing the wangColor
      const completedColors = tuple[1].map((wc) => {
        return {
          ...wc,
          rank: index,
        } as WangColor
      })
      return completedColors
    })
    .reverse() // reverse to get it in descending order

  if (!wangColorsWithRanks.length) {
    throw new Error('No wangsets in tileset json')
  }

  // Group colors by Biome, some colors may be in multiple biomes
  const colorsByBiome: Map<Biome, WangColor[]> = new Map()
  wangColorsWithRanks.forEach((color) => {
    color.biomes.forEach((biome) => {
      const colors = colorsByBiome.get(biome) ?? []
      if (!colors.length) {
        colorsByBiome.set(biome, colors)
      }
      colors.push(color)
    })
  })

  // Create a rankInfo[] for each biome
  const ranksByBiome: Map<Biome, RankInfo[]> = new Map()
  colorsByBiome.forEach((colors, biome) => {
    const colorsByRank = groupBy(colors, (c) => c.rank)
    const rankInfos = Array.from(colorsByRank.entries())
      .map(([rank, colorsInRank]) => {
        const rankInfo: RankInfo = {
          rank,
          colors: colorsInRank,
          getColor: createGetColorForBiome(colorsInRank),
          minHeight: colorsInRank[0].minHeight,
        }
        return rankInfo
      })
      .sort((a, b) => b.rank - a.rank) // sort in descending order

    ranksByBiome.set(biome, rankInfos)
  })

  return { ranksByBiome, allColors: wangColorsWithRanks }
}

const createGetColorForBiome = (colorsInRank: WangColor[]) => {
  const getColor = (): WangColor => {
    return colorsInRank[0]
  }
  return getColor
}

const loadImages = (tileSetInfo: TileSetInfo, scene: Phaser.Scene) => {
  tileSetInfo.tiledTileSetJson.tiles?.forEach((tile) => {
    if (tile.image) {
      scene.load.image(tile.image, TILES_PATH + '/' + tile.image)
      // Do we need to add the image to the cache?
    }
  })
  if (tileSetInfo.tileSetImage) {
    scene.load.image(tileSetInfo.tileSetImage, TILES_PATH + '/' + tileSetInfo.tileSetImage)
    scene.cache.addCustom(TILE_SET_CACHE_ID)
    scene.cache.custom.tileSetInfo.add(tileSetInfo.tileSetName, tileSetInfo)
  }
}

const createGetTileForKey = (
  tilesetJson: TiledTileSetJson,
  getTileInfo: (tileId: number) => TileInfo,
) => {
  // Map composite key to tileId
  const wangTilesMap: Map<string, TileInfo[]> = new Map()
  tilesetJson.wangsets?.flatMap((wangSet) => {
    wangSet.wangtiles?.forEach((wangTile) => {
      const key = keyForWangId(wangTile.wangid)
      let tiles = wangTilesMap.get(key)
      if (!tiles) {
        tiles = []
        wangTilesMap.set(key, tiles)
      }
      tiles.push(getTileInfo(wangTile.tileid))
    })
  })

  const getTileForKey = (key: string) => {
    const tiles = wangTilesMap.get(key)
    if (!tiles || tiles.length === 0) {
      return undefined
    }
    return sampleTile(tiles)
  }

  return getTileForKey
}

export const keyForWangId = (
  wangId: [number, number, number, number, number, number, number, number],
) => {
  const [_a, tr, _b, br, _c, bl, _d, tl] = wangId
  return `${tr}:${br}:${bl}:${tl}`
}

const jsonColorToWangColor = (jsonColor: TiledWangColorJson, index: number) => {
  const { color, name, probability } = jsonColor
  return {
    color,
    name,
    probability,
    id: index + 1, // id's start at 1 not 0 since 0 is treated as null in the json
    representativeTileId: jsonColor.tile,
    minHeight: getMinHeightProperty(jsonColor),
    biomes: getBiomes(jsonColor),
  }
}

const getMinHeightProperty = (color: TiledWangColorJson): number | undefined => {
  const props = color.properties
  const minHeightProp = props?.find((p) => p.name === 'minHeight')
  if (!minHeightProp) {
    console.warn(`No minHeight property found for color: ${color.name}`)
  }
  return (minHeightProp?.value as number) ?? undefined
}

export const updateMapDataFromMultiLayerMap = (
  width: number,
  height: number,
  map: Phaser.Tilemaps.Tilemap,
  multiLayerMap: MultiLayerTile[][],
) => {
  clearMap(width, height, map)

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const mlTile = multiLayerMap[r][c]
      mlTile.layers.forEach((layer) => {
        map.putTileAt(layer.tileId, c, r, false, layer.color.name)
      })
    }
  }
}

export const clearMap = (width: number, height: number, map: Phaser.Tilemaps.Tilemap) => {
  map.layers.forEach((layer) => {
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        layer.tilemapLayer.removeTileAt(c, r)
      }
    }
  })
}

export const initializePhaserTileMap = (
  width: number,
  height: number,
  tileSetInfo: TileSetInfo,
  scene: Phaser.Scene,
  offsetWorldX: number = 0,
  offsetWorldY: number = 0,
) => {
  var mapData = new Phaser.Tilemaps.MapData({
    width,
    height,
    name: 'map',
    tileWidth: tileSetInfo.tileWidth,
    tileHeight: tileSetInfo.tileHeight,
    orientation: Phaser.Tilemaps.ORTHOGONAL,
    format: Phaser.Tilemaps.Formats.ARRAY_2D,
    // @ts-ignore Phaser's type is wrong
    version: tileSetInfo.tiledTileSetJson.version,
    // properties: json.properties,
    renderOrder: 'right-down',
  })

  const map = new Phaser.Tilemaps.Tilemap(scene, mapData)

  // Add tileset images
  tileSetInfo.tiledTileSetJson.tiles?.forEach((jsonTile) => {
    return map.addTilesetImage(
      jsonTile.image!,
      jsonTile.image!,
      undefined,
      undefined,
      undefined,
      undefined,
      jsonTile.id,
    )
  })
  const tileSetImage = tileSetInfo.tiledTileSetJson.image
  if (tileSetImage) {
    map.addTilesetImage(tileSetImage, tileSetImage, undefined, undefined, undefined, undefined, 0)
  }

  // create layer for each color
  tileSetInfo.colorInfo.allColors.forEach((color) => {
    map
      .createBlankLayer(
        color.name,
        map.tilesets,
        offsetWorldX,
        offsetWorldY,
        width,
        height,
        tileSetInfo.tileWidth,
        tileSetInfo.tileHeight,
      )
      ?.setDepth(color.rank - tileSetInfo.colorInfo.maxRank) // Use negative depth for map so everything else can be positive
  })

  return map
}

/**
 * Returns a random tile from the list of tiles based on the probabilities of those tiles
 * @param tiles
 */
const sampleTile = (tiles: TileInfo[]) => {
  const totalProbability = tiles.reduce((acc, cur) => acc + cur.probability, 0)
  const random = Math.random() * totalProbability
  let runningTotal = 0
  for (const tile of tiles) {
    runningTotal += tile.probability
    if (random <= runningTotal) {
      return tile.tileId
    }
  }
  throw Error('No tiles to sample from.')
}

export const convert1DTo2DArray = (data: number[], width: number, height: number): number[][] => {
  const result = []
  for (let i = 0; i < height; i++) {
    result.push(data.slice(i * width, (i + 1) * width))
  }
  return result
}

function getBiomes(jsonColor: TiledWangColorJson): Biome[] {
  // Biomes prop is comma separated string
  const biomes = jsonColor.properties
    ?.filter((p) => p.name === 'biomes')
    .map((p) => p.value as string)
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())

  // Validate biomes
  if (biomes && biomes.length) {
    for (const biome of biomes) {
      if (!isBiome(biome)) {
        throw Error(`Invalid biome: ${biome}`)
      }
    }
  }

  if (!biomes || biomes.length === 0) {
    // Default to all biomes
    return [...ALL_BIOMES]
  }
  return biomes as Biome[]
}
