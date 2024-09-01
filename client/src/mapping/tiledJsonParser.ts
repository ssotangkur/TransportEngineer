import { ASSETS_PATH } from 'src/constants'
import { OrchestratableScene } from 'src/editor/scenes/orchestratableScene'
import { EquilavencyGroups } from './equilavencyGroup'
import { TiledProperty, TiledTileSetJson, TiledWangColorJson, TiledWangSetJson } from './tiledTypes'
import { generateMapDataUsingNoise, WangColor } from './noiseGeneratedMap'
import _ from 'lodash'

const TILES_PATH = ASSETS_PATH + '/tiles/inkscape'
const TILE_SET_CACHE_ID = 'tileSetInfo'

export type ColorInfo = {
  colors: WangColor[]
  wangTilesMap: Map<string, number> // Maps composite key to tileId
}

export type TileSetInfo = {
  tileSetImage: string
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
  scene: OrchestratableScene,
): Promise<TileSetInfo> => {
  const resp = await fetch(TILES_PATH + '/' + tiledTileSetJsonFile)
  const tileSet: TiledTileSetJson = await resp.json()

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
      colors: parseWangColors(tileSet.wangsets ?? []),
      wangTilesMap: createWangTilesMap(tileSet),
    },

    tiledTileSetJson: tileSet,
  }
  // Compute equivalency groups
  tileSet.tiles.forEach((tile) => {
    const equivalenceGroup = tile.properties?.find((prop) => prop.name === 'equivalencyGroup')
    if (equivalenceGroup) {
      // Need to add firstgid so that these tile ids so match the tile ids in the map data
      tileSetInfo.equivalencyGroups.add(tile.id + tileSet.firstgid, equivalenceGroup.value)
    }
  })

  loadImages(tileSetInfo, scene)

  return tileSetInfo
}

const loadImages = (tileSetInfo: TileSetInfo, scene: OrchestratableScene) => {
  tileSetInfo.tiledTileSetJson.tiles.forEach((tile) => {
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

const createWangTilesMap = (tilesetJson: TiledTileSetJson) => {
  // Map composite key to tileId
  const wangTilesMap: Map<string, number> = new Map()
  tilesetJson.wangsets?.flatMap((wangSet) => {
    wangSet.wangtiles?.forEach((wangTile) => {
      wangTilesMap.set(keyForWangId(wangTile.wangid), wangTile.tileid)
    })
  })
  return wangTilesMap
}

export const keyForWangId = (
  wangId: [number, number, number, number, number, number, number, number],
) => {
  const [_a, tr, _b, br, _c, bl, _d, tl] = wangId
  return `${tr}:${br}:${bl}:${tl}`
}

const parseWangColors = (wangsets: TiledWangSetJson[]) => {
  const wangColors =
    wangsets
      ?.flatMap((wangSet) => {
        return wangSet.colors.map(jsonColorToWangColor)
      })
      .sort((a, b) => {
        // sort ascending...
        return a.minHeight - b.minHeight
      })
      .map((wc, rank) => {
        // so we can add "rank"...
        return {
          ...wc,
          rank,
        } as WangColor
      })
      .reverse() ?? [] // finally, reverse to get it in descending order

  if (!wangColors.length) {
    throw new Error('No wangsets in tileset json')
  }
  return wangColors
}

const jsonColorToWangColor = (
  jsonColor: TiledWangColorJson,
  index: number,
): Omit<WangColor, 'rank'> => {
  const { color, name, probability } = jsonColor
  return {
    color,
    name,
    probability,
    id: index + 1, // id's start at 1 not 0 since 0 is treated as null in the json
    representativeTileId: jsonColor.tile,
    minHeight: getMinHeightProperty(jsonColor.properties),
  }
}

const getMinHeightProperty = (props: TiledProperty[] | undefined) => {
  const minHeightProp = props?.find((p) => p.name === 'minHeight')
  if (!minHeightProp) {
    throw new Error('No minHeight property found.')
  }
  return minHeightProp.value as number
}

// export const createTiledMapLayer = (tileSetInfo: TileSetInfo, scene: OrchestratableScene) => {
//   // const layer0 = tileSetInfo.layers[0]
//   const data = convert1DTo2DArray(layer0.data, layer0.width, layer0.height)
//   const map = scene.make.tilemap({
//     data,
//     tileWidth: tileSetInfo.tileWidth,
//     tileHeight: tileSetInfo.tileHeight,
//   })
//   const tileset = map.addTilesetImage(
//     'tileset',
//     tileSetInfo.tileSetImage,
//     tileSetInfo.tileWidth,
//     tileSetInfo.tileHeight,
//     tileSetInfo.tileMargin,
//     tileSetInfo.tileSpacing,
//     tileSetInfo.firstGid,
//   )
//   if (tileset === null) {
//     throw Error('tileset is null')
//   }
//   map.createLayer(0, tileset)
//   return {
//     phaserTileMap: map,
//     mapData: data,
//   }
// }

// let sampleIndex = 0
// const sampleLast = <T>(arr: T[]) => {
//   sampleIndex++
//   const ans = arr[(sampleIndex + 7) % arr.length]

//   return ans
// }

export const updateMapDataFromTileSetJson = (
  width: number,
  height: number,
  tileSetInfo: TileSetInfo,
  map: Phaser.Tilemaps.Tilemap,
) => {
  const multiLayerMap = generateMapDataUsingNoise(width, height, tileSetInfo)

  // const layer0 = tileSetInfo.layers[0]
  // canonicalize the tile numbers using the equivalence groups
  // const canonicalMap = layer0.data.map((tileNum) =>
  //   tileSetInfo.equivalencyGroups.getCanonicalId(tileNum),
  // )

  clearMap(width, height, map)

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const mlTile = multiLayerMap[r][c]
      mlTile.layers.forEach((layer) => {
        // if (layer.color.name === 'water') {
        //   map.putTileAt(10, c, r, false, layer.color.name)
        // } else {
        //   map.putTileAt(32, c, r, false, layer.color.name)
        // }
        map.putTileAt(layer.tileId, c, r, false, layer.color.name)
      })
    }
  }
  // map.putTileAt(4, 0, 0, false, 'sand')

  // const exampleMap = convert1DTo2DArray(canonicalMap, layer0.width, layer0.height)
  // const possibleMap = new PossibleTilesMap(width, height, exampleMap)
  // const data = possibleMap.collapse()
  // return data
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
  scene: OrchestratableScene,
) => {
  // const map = scene.make.tilemap({
  //   tileWidth: tileSetInfo.tileWidth,
  //   tileHeight: tileSetInfo.tileHeight,
  // })

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

  // We can directly call the tileset parser
  // tileSetInfo.tiledTileSetJson['firstgid'] = 0
  // var sets = Phaser.Tilemaps.Parsers.Tiled.ParseTilesets({
  //   tilesets: [tileSetInfo.tiledTileSetJson],
  // }) as any

  // mapData.tilesets = sets.tilesets
  // mapData.imageCollections = sets.imageCollections
  // mapData.tiles = Phaser.Tilemaps.Parsers.Tiled.BuildTilesetIndex(mapData)

  const map = new Phaser.Tilemaps.Tilemap(scene, mapData)

  tileSetInfo.tiledTileSetJson.tiles.forEach((jsonTile) => {
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

  // create layer for each color
  const maxRank = Math.max(...tileSetInfo.colorInfo.colors.map((c) => c.rank))
  tileSetInfo.colorInfo.colors.forEach((color) => {
    map
      .createBlankLayer(
        color.name,
        map.tilesets,
        0,
        0,
        width,
        height,
        tileSetInfo.tileWidth,
        tileSetInfo.tileHeight,
      )
      ?.setDepth(color.rank - maxRank) // Use negative depth for map so everything else can be positive
  })

  return map
}

// export const createGeneratedMapLayerFromTileSetInfo = (
//   width: number,
//   height: number,
//   tileSetInfo: TileSetInfo,
//   scene: OrchestratableScene,
// ) => {
//   const data = generateMapDataUsingNoise(width, height, tileSetInfo)

//   map.createLayer(0, tileset)
//   return {
//     phaserTileMap: map,
//     mapData: data,
//   }
// }

export const convert1DTo2DArray = (data: number[], width: number, height: number): number[][] => {
  const result = []
  for (let i = 0; i < height; i++) {
    result.push(data.slice(i * width, (i + 1) * width))
  }
  return result
}
