import { TileSetInfo, loadTiledTileSetJson } from 'src/mapping/tiledJsonParser'
import { BaseSystem } from './baseSystem'
import { BiomeCell, createBiomeMap } from 'src/mapping/biome'
import { IWorld } from 'bitecs'
import { addTileSetInfo, emptyMapInfo, MapInfo } from 'src/utils/mapInfo'
import { createColorMapper, WangColor } from 'src/mapping/mapGenerator'
import { Events } from 'src/events/events'
import { AABB } from 'src/utils/aabb'

const TILED_TILESET_JSON_FILE = 'terrain-v7.json'

export type MapWorld = {
  mapSystem: {
    map?: Phaser.Tilemaps.Tilemap
    tileSetInfo?: TileSetInfo
    biomeMap?: (r: number, c: number) => BiomeCell
    colorMap?: (r: number, c: number) => WangColor
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
    this.initializeMap()
  }

  private regenerateMap() {
    this.world.mapSystem.mapInfo.seed = Date.now()
    this.initializeMap()
  }

  private initializeMap() {
    if (!this.world.mapSystem.tileSetInfo) {
      throw new Error('No tileSetInfo, it should have been loaded by preload()')
    }

    this.world.mapSystem.biomeMap = createBiomeMap(this.world.mapSystem.mapInfo.seed)
    this.world.mapSystem.colorMap = createColorMapper(
      this.world.mapSystem.tileSetInfo,
      this.world.mapSystem.biomeMap,
    )

    Events.emit('miniMapUpdated', {
      colorMap: this.world.mapSystem.colorMap,
      rect: new AABB(0, 0, 256, 256),
    })
  }
}
