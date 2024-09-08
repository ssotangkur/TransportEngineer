import {
  TileSetInfo,
  initializePhaserTileMap,
  loadTiledTileSetJson,
  updateMapDataFromTileSetJson,
} from 'src/mapping/tiledJsonParser'
import { BaseSystem } from './baseSystem'
import { Events } from 'src/events/events'
import { BiomeCell } from 'src/mapping/biome'

const TILED_TILESET_JSON_FILE = 'terrain-v7.json'

const MAP_WIDTH = 256 // Only use these constants here, all other places should have this passed in
const MAP_HEIGHT = 256

export type MapInfoWorld = {
  mapInfoWorld: {
    tilesheetUrl: string
    tilemapJsonPath: string
  }
}

export type MapWorld = {
  mapSystem: {
    map?: Phaser.Tilemaps.Tilemap
    tileSetInfo?: TileSetInfo
    biomeMap?: BiomeCell[][]
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
    this.scene.load.rexAwait(async (successCallback, failureCallback) => {
      try {
        this.world.mapSystem.tileSetInfo = await loadTiledTileSetJson(
          TILED_TILESET_JSON_FILE,
          this.scene,
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
    if (this.world.mapSystem.tileSetInfo && this.world.mapSystem.map) {
      updateMapDataFromTileSetJson(MAP_WIDTH, MAP_HEIGHT, this.world)
      Events.emit('mapUpdated')
    }
  }

  private createMap() {
    if (this.world.mapSystem.tileSetInfo) {
      // const tiledData = createTiledMapLayer(this.world.mapSystem.tileSetInfo, this.scene)
      // this.world.mapSystem.map = tiledData.phaserTileMap

      this.world.mapSystem.map = initializePhaserTileMap(
        MAP_WIDTH,
        MAP_HEIGHT,
        this.world.mapSystem.tileSetInfo,
        this.scene,
      )

      updateMapDataFromTileSetJson(MAP_WIDTH, MAP_HEIGHT, this.world)
      Events.emit('mapUpdated')
    }
  }

  public get heightInPixels() {
    return this.world.mapSystem.map?.heightInPixels ?? 0
  }

  public get widthInPixels() {
    return this.world.mapSystem.map?.widthInPixels ?? 0
  }
}
