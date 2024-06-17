import { BaseSystem } from './baseSystem'

const EXTRUSION_PX = 8
const TILE_MARGIN = EXTRUSION_PX
const TILE_SPACING = EXTRUSION_PX * 2

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
    this.scene.load.image('tiles', this.world.mapInfoWorld.tilesheetUrl)
    this.scene.load.tilemapTiledJSON('map', this.world.mapInfoWorld.tilemapJsonPath)
  }

  public create() {
    this.world.mapSystem.map = this.scene.make.tilemap({ key: 'map' })
    const tileset = this.world.mapSystem.map.addTilesetImage(
      'tileset',
      'tiles',
      undefined,
      undefined,
      TILE_MARGIN,
      TILE_SPACING,
    )
    if(tileset === null) {
      throw Error("tileset is null")
    }
    this.world.mapSystem.map.createLayer('Tile Layer 1', tileset)
  }

  public get heightInPixels() {
    return this.world.mapSystem.map?.heightInPixels ?? 0
  }

  public get widthInPixels() {
    return this.world.mapSystem.map?.widthInPixels ?? 0
  }
}
