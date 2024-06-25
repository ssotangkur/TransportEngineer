import { TileSetInfo, convert1DTo2DArray, parseTiledJson } from 'src/mapping/tiledJsonParser'
import { BaseSystem } from './baseSystem'
import { ASSETS_PATH } from 'src/constants'

const TILE_SET_IMAGE_KEY = 'tiles'

const TILES_PATH = ASSETS_PATH + '/tiles'
const TILED_JSON_FILE = 'te.json'

export type MapInfoWorld = {
  mapInfoWorld: {
    tilesheetUrl: string
    tilemapJsonPath: string
  }
}

export type MapWorld = {
  mapSystem: {
    map?: Phaser.Tilemaps.Tilemap
  }
}

/**
 * Tilesheet image should be "Extruded" using the TILE_MARGIN and TILE_SPACING above.
 * Using the program: https://github.com/sporadic-labs/tile-extruder
 * Example usage: tile-extruder --tileWidth 128 --tileHeight 128 --extrusion 8 --input tilesheet_complete_2X.png --output tilesheet_complete_2X_extruded.png
 * Tiled can use 0 for both settings, we'll have Phaser make the adjustments for us.
 *
 * tilesheetUrl should point to the extruded image, not the original
 */
export class MapSystem<WorldIn extends MapInfoWorld> extends BaseSystem<
  MapInfoWorld,
  WorldIn,
  MapWorld
> {
  createWorld(_worldIn: WorldIn) {
    const mapWorld: MapWorld = {
      mapSystem: {},
    }
    return mapWorld
  }

  public preload() {
    // const tileSetInfo = parseTiledJson(this.world.mapInfoWorld.tilemapJsonPath)
    this.scene.load.rexAwait(async (successCallback, failureCallback) => {
      try {
        const tileSetInfo = await parseTiledJson(TILES_PATH + '/' + TILED_JSON_FILE)
        this.scene.load.image(TILE_SET_IMAGE_KEY, TILES_PATH + '/' + tileSetInfo.tileSetImage)
        this.scene.cache.addCustom('tileSetInfo')
        this.scene.cache.custom.tileSetInfo.add(TILED_JSON_FILE, tileSetInfo)
        successCallback()
      } catch (error) {
        failureCallback(error)
      }
    })
    // this.scene.load.image('tiles', this.world.mapInfoWorld.tilesheetUrl)
    // this.scene.load.tilemapTiledJSON('map', this.world.mapInfoWorld.tilemapJsonPath)
  }

  public create() {
    // this.world.mapSystem.map = this.scene.make.tilemap({ key: 'map'})
    const tileSetInfo = this.scene.cache.custom.tileSetInfo.get(TILED_JSON_FILE) as TileSetInfo

    const layer0 = tileSetInfo.layers[0]
    const shiftedData = layer0.data.map((x) => x - tileSetInfo.firstGid)
    const data = convert1DTo2DArray(shiftedData, layer0.width, layer0.height)
    this.world.mapSystem.map = this.scene.make.tilemap({
      key: layer0.name,
      data,
      tileWidth: tileSetInfo.tileWidth,
      tileHeight: tileSetInfo.tileHeight,
    })
    const tileset = this.world.mapSystem.map.addTilesetImage(
      'tileset',
      TILE_SET_IMAGE_KEY,
      tileSetInfo.tileWidth,
      tileSetInfo.tileHeight,
      tileSetInfo.tileMargin,
      tileSetInfo.tileSpacing,
    )
    if (tileset === null) {
      throw Error('tileset is null')
    }
    this.world.mapSystem.map.createLayer('layer', tileset)
  }

  public get heightInPixels() {
    return this.world.mapSystem.map?.heightInPixels ?? 0
  }

  public get widthInPixels() {
    return this.world.mapSystem.map?.widthInPixels ?? 0
  }
}
