const EXTRUSION_PX = 8
const TILE_MARGIN = EXTRUSION_PX
const TILE_SPACING = EXTRUSION_PX * 2

/**
 * Tilesheet image should be "Extruded" using the TILE_MARGIN and TILE_SPACING above.
 * Using the program: https://github.com/sporadic-labs/tile-extruder
 * Example usage: tile-extruder --tileWidth 128 --tileHeight 128 --extrusion 8 --input tilesheet_complete_2X.png --output tilesheet_complete_2X_extruded.png
 * Tiled can use 0 for both settings, we'll have Phaser make the adjustments for us.
 *
 * tilesheetUrl should point to the extruded image, not the original
 */
export class MapSystem {
  private map?: Phaser.Tilemaps.Tilemap

  constructor(
    private scene: Phaser.Scene,
    private tilesheetUrl: string,
    private tilemapJsonPath: string,
  ) {}

  public preload() {
    this.scene.load.image('tiles', this.tilesheetUrl)
    this.scene.load.tilemapTiledJSON('map', this.tilemapJsonPath)
  }

  public create() {
    this.map = this.scene.make.tilemap({ key: 'map' })
    const tileset = this.map.addTilesetImage(
      'tileset',
      'tiles',
      undefined,
      undefined,
      TILE_MARGIN,
      TILE_SPACING,
    )
    this.map.createLayer('Tile Layer 1', tileset)
  }

  public get heightInPixels() {
    return this.map?.heightInPixels ?? 0
  }

  public get widthInPixels() {
    return this.map?.widthInPixels ?? 0
  }
}
