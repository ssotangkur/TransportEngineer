import { ColorMapper } from 'src/mapping/mapGenerator'

export type MiniMapChunk = {
  key: string
  texture: Phaser.Textures.Texture
}

/**
 * Handles the object pooling of mini map tiles and their textures
 */
export class MiniMapChunkManager {
  private tiles: Map<string, MiniMapChunk> = new Map()
  private unusedTiles: MiniMapChunk[] = []

  private tempBuffer: Uint8Array

  constructor(private chunkSize: number, private textureManager: Phaser.Textures.TextureManager) {
    this.tempBuffer = new Uint8Array(this.chunkSize * this.chunkSize * 4)
  }

  public createChunk(key: string, colorMapper: ColorMapper): MiniMapChunk {
    const cached = this.tiles.get(key)
    if (cached) {
      return cached
    }

    let tile = this.unusedTiles.pop()
    if (!tile) {
      tile = this.createNewChunk(key, colorMapper)
      this.tiles.set(key, tile)
      return tile
    }
    // Got an unused tile, update it
    tile = this.updateExistingChunk(tile, key, colorMapper)
    this.tiles.set(key, tile)
    return tile
  }

  public releaseChunk(key: string) {
    console.debug('[minimapChunkManager] releasing chunk ', key)
    const tile = this.tiles.get(key)
    if (!tile) {
      throw new Error('tile not found')
    }

    this.tiles.delete(key)
    this.unusedTiles.push(tile)
  }

  // Creates new MiniMapTile object w/o doing any pooling
  private createNewChunk(key: string, colorMapper: ColorMapper) {
    console.debug('[minimapChunkManager] creating new chunk ', key)

    this.colorTempBuffer(colorMapper)
    const texture = this.textureManager.addUint8Array(
      key,
      this.tempBuffer,
      this.chunkSize,
      this.chunkSize,
    )
    if (!texture) {
      throw new Error('failed to create texture')
    }

    const tile = {
      key,
      texture,
    }

    return tile
  }

  // Removes the texture currently associated with the tile and adds a new one with the provided key
  private updateExistingChunk(
    tile: MiniMapChunk,
    key: string,
    colorMapper: ColorMapper,
  ): MiniMapChunk {
    this.colorTempBuffer(colorMapper)

    console.debug('[minimapChunkManager] updating existing chunk ', key)
    this.textureManager.remove(tile.key)
    const texture = this.textureManager.addUint8Array(
      key,
      this.tempBuffer,
      this.chunkSize,
      this.chunkSize,
    )
    if (!texture) {
      throw new Error('failed to create texture')
    }
    tile.texture = texture
    tile.key = key
    return tile
  }

  // Creates a side effect of setting the tempBuffer with the colors from the colorMapper
  private colorTempBuffer(colorMapper: ColorMapper) {
    // set the tempBuffer with the colors
    let colorIdx = 0
    for (let y = 0; y < this.chunkSize; y++) {
      for (let x = 0; x < this.chunkSize; x++) {
        const wangColor = colorMapper(x, y)
        const color = Phaser.Display.Color.HexStringToColor(wangColor.color)
        this.tempBuffer[colorIdx++] = color.red
        this.tempBuffer[colorIdx++] = color.green
        this.tempBuffer[colorIdx++] = color.blue
        this.tempBuffer[colorIdx++] = 192
      }
    }
  }

  getChunkKeyForTileCoord(x: number, y: number) {
    const chunkX = Math.floor(x / this.chunkSize)
    const chunkY = Math.floor(y / this.chunkSize)
    return `${chunkX},${chunkY}`
  }
}
