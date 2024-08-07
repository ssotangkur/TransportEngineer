import {
  TileSetInfo,
  createGeneratedMapLayerFromTileSetInfo,
  generateMapDataFromTileSetInfo,
  loadTiledJson,
} from 'src/mapping/tiledJsonParser'
import { BaseSystem } from './baseSystem'
import { Events } from 'src/events/events'

//const TILED_JSON_FILE = 'te.json'
const TILED_JSON_FILE = 'grass_biome.json'

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
        this.world.mapSystem.tileSetInfo = await loadTiledJson(TILED_JSON_FILE, this.scene)
        successCallback()
      } catch (error) {
        failureCallback(error)
      }
    })
  }

  public create() {
    this.createMap()
    const regenMapClosure = () => {
      this.regenerateMap()
    }
    Events.on('regenerateMap', regenMapClosure)
    const unsubscribe = () => {
      Events.off('regenerateMap', regenMapClosure)
    }
    this.scene.events.on('destroy', unsubscribe)
  }

  private regenerateMap() {
    if (this.world.mapSystem.tileSetInfo && this.world.mapSystem.map) {
      const data = generateMapDataFromTileSetInfo(100, 100, this.world.mapSystem.tileSetInfo)
      this.world.mapSystem.map.putTilesAt(data, 0, 0)
    }
  }

  private createMap() {
    if (this.world.mapSystem.tileSetInfo) {
      // const tiledData = createTiledMapLayer(this.world.mapSystem.tileSetInfo, this.scene)
      // this.world.mapSystem.map = tiledData.phaserTileMap

      const generatedData = createGeneratedMapLayerFromTileSetInfo(
        100,
        100,
        this.world.mapSystem.tileSetInfo,
        this.scene,
      )
      this.world.mapSystem.map = generatedData.phaserTileMap
    }
  }

  public get heightInPixels() {
    return this.world.mapSystem.map?.heightInPixels ?? 0
  }

  public get widthInPixels() {
    return this.world.mapSystem.map?.widthInPixels ?? 0
  }
}
