export type MiniMapTile = {
  key: string
  texture: Phaser.Textures.Texture
}

/**
 * Handles the object pooling of mini map tiles and their t
 */
export class MiniMapTileManager {
  private tiles: Map<string, MiniMapTile> = new Map()
  private unusedTiles: MiniMapTile[] = []

  private tempBuffer: Uint8Array

  constructor(
    private width: number,
    private height: number,
    private textureManager: Phaser.Textures.TextureManager,
  ) {
    this.tempBuffer = new Uint8Array(this.width * this.height * 4)
  }

  public createTile(
    key: string,
    colorMapper: (x: number, y: number) => Phaser.Display.Color,
  ): MiniMapTile {
    let tile = this.unusedTiles.pop()
    if (!tile) {
      tile = this.createNewTile(key, colorMapper)
      this.tiles.set(key, tile)
    }
    // Got an unused tile, update it
    tile = this.updateExistingTile(tile, key, colorMapper)
    this.tiles.set(key, tile)
    return tile
  }

  public releaseTile(key: string) {
    const tile = this.tiles.get(key)
    if (!tile) {
      throw new Error('tile not found')
    }

    this.tiles.delete(key)
    this.unusedTiles.push(tile)
  }

  // Creates new MiniMapTile object w/o doing any pooling
  private createNewTile(key: string, colorMapper: (x: number, y: number) => Phaser.Display.Color) {
    this.colorTempBuffer(colorMapper)
    const texture = this.textureManager.addUint8Array(key, this.tempBuffer, this.width, this.height)
    if (!texture) {
      throw new Error('failed to create texture')
    }

    const tile = {
      key,
      texture,
    }

    return tile
  }

  private updateExistingTile(
    tile: MiniMapTile,
    key: string,
    colorMapper: (x: number, y: number) => Phaser.Display.Color,
  ): MiniMapTile {
    this.colorTempBuffer(colorMapper)

    this.textureManager.remove(tile.key)
    const texture = this.textureManager.addUint8Array(key, this.tempBuffer, this.width, this.height)
    if (!texture) {
      throw new Error('failed to create texture')
    }
    tile.texture = texture
    tile.key = key
    return tile
  }

  // Creates a side effect of setting the tempBuffer with the colors from the colorMapper
  private colorTempBuffer(colorMapper: (x: number, y: number) => Phaser.Display.Color) {
    // set the tempBuffer with the colors
    let colorIdx = 0
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = colorMapper(x, y)
        this.tempBuffer[colorIdx++] = color.red
        this.tempBuffer[colorIdx++] = color.green
        this.tempBuffer[colorIdx++] = color.blue
        this.tempBuffer[colorIdx++] = 192
      }
    }
  }
}
