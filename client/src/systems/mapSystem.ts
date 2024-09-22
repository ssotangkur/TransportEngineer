import { TileSetInfo, loadTiledTileSetJson } from 'src/mapping/tiledJsonParser'
import { BaseSystem } from './baseSystem'
import { BiomeCell } from 'src/mapping/biome'
import { IWorld } from 'bitecs'
import { addTileSetInfo, emptyMapInfo, MapInfo } from 'src/utils/mapInfo'

const TILED_TILESET_JSON_FILE = 'terrain-v7.json'

const MAP_WIDTH = 4 // Only use these constants here, all other places should have this passed in
const MAP_HEIGHT = 4

export type MapWorld = {
  mapSystem: {
    map?: Phaser.Tilemaps.Tilemap
    tileSetInfo?: TileSetInfo
    biomeMap?: BiomeCell[][]
    mapInfo: MapInfo
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
export class MapSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, MapWorld> {
  createWorld(_worldIn: WorldIn) {
    const mapWorld: MapWorld = {
      mapSystem: {
        mapInfo: emptyMapInfo(Date.now()),
      },
    }
    return mapWorld
  }

  public preload() {
    this.scene.load.rexAwait(async (successCallback, failureCallback) => {
      try {
        this.world.mapSystem.tileSetInfo = await loadTiledTileSetJson(
          TILED_TILESET_JSON_FILE,
          this.scene,
        )
        this.world.mapSystem.mapInfo = addTileSetInfo(
          this.world.mapSystem.mapInfo,
          this.world.mapSystem.tileSetInfo,
        )
        successCallback()
      } catch (error) {
        failureCallback()
      }
    })

    this.subUnsub('regenerateMap', () => {
      this.regenerateMap()
    })
  }

  public create() {
    this.createMap()
  }

  private regenerateMap() {
    this.updateMap()
  }

  private createMap() {
    // if (this.world.mapSystem.tileSetInfo) {
    //   this.world.mapSystem.map = initializePhaserTileMap(
    //     MAP_WIDTH,
    //     MAP_HEIGHT,
    //     this.world.mapSystem.tileSetInfo,
    //     this.scene,
    //   )
    //   this.updateMap()
    // }
  }

  private updateMap() {
    const tileSetInfo = this.world.mapSystem.tileSetInfo
    if (!tileSetInfo) {
      return
    }
    // const map = this.world.mapSystem.map
    // if (!map) {
    //   return
    // }

    // const { multiLayerMap, biomeMap } = generateMapDataUsingNoise(
    //   MAP_WIDTH,
    //   MAP_HEIGHT,
    //   tileSetInfo,
    // )
    // this.world.mapSystem.biomeMap = biomeMap

    // updateMapDataFromMultiLayerMap(MAP_WIDTH, MAP_HEIGHT, map, multiLayerMap)

    // Events.emit('mapUpdated')
  }
}
