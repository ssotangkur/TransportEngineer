import { ASSETS_PATH } from 'src/constants'
import { OrchestratableScene } from 'src/editor/scenes/orchestratableScene'

const TILES_PATH = ASSETS_PATH + '/tiles'
const TILE_SET_CACHE_ID = 'tileSetInfo'
const TILE_SET_IMAGE_KEY = 'tiles'

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

export type TileMap = {
  data: number[][]
  tileWidth: number
  tileHeight: number
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

export type TiledData = {
  tileSetInfo: TileSetInfo
  tileMap: TileMap
}

/**
 * Fetches and parses a Tiled JSON file and associated tileset image file.
 * The file must be located in the /assets/tiles directory.
 * Call this in the preload() method of a Phaser scene using the rexAwait loader.
 *
 * @param tiledJsonFile
 * @param scene
 * @returns
 */
export const loadTiledJson = async (
  tiledJsonFile: string,
  scene: OrchestratableScene,
): Promise<TileSetInfo> => {
  const resp = await fetch(TILES_PATH + '/' + tiledJsonFile)
  const tiledJson: TiledJson = await resp.json()

  // Only support one tileset for now
  const tileSet = tiledJson.tilesets[0]

  const tileSetInfo: TileSetInfo = {
    firstGid: tileSet.firstgid,
    tileSetImage: tileSet.image,
    tileSetName: tileSet.name,
    tileHeight: tileSet.tileheight,
    tileWidth: tileSet.tilewidth,
    tileMargin: tileSet.margin,
    tileSpacing: tileSet.spacing,
    layers: tiledJson.layers,
  }

  scene.load.image(tileSetInfo.tileSetImage, TILES_PATH + '/' + tileSetInfo.tileSetImage)
  scene.cache.addCustom(TILE_SET_CACHE_ID)
  scene.cache.custom.tileSetInfo.add(tileSetInfo.tileSetName, tileSetInfo)

  return tileSetInfo
}

export const createTiledMap = (tileSetInfo: TileSetInfo, scene: OrchestratableScene) => {
  const layer0 = tileSetInfo.layers[0]
  const data = convert1DTo2DArray(layer0.data, layer0.width, layer0.height)
  const map = scene.make.tilemap({
    data,
    tileWidth: tileSetInfo.tileWidth,
    tileHeight: tileSetInfo.tileHeight,
  })
  const tileset = map.addTilesetImage(
    'tileset',
    tileSetInfo.tileSetImage,
    tileSetInfo.tileWidth,
    tileSetInfo.tileHeight,
    tileSetInfo.tileMargin,
    tileSetInfo.tileSpacing,
    tileSetInfo.firstGid,
  )
  if (tileset === null) {
    throw Error('tileset is null')
  }
  map.createLayer(0, tileset)
  return {
    phaserTileMap: map,
    mapData: data,
  }
}

export const convert1DTo2DArray = (data: number[], width: number, height: number): number[][] => {
  const result = []
  for (let i = 0; i < height; i++) {
    result.push(data.slice(i * width, (i + 1) * width))
  }
  return result
}
