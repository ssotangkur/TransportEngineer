import { ColorMapper } from 'src/mapping/mapGenerator'
import { MiniMapChunkManager } from './miniMapChunkManager'
import { MiniMapVisibilityManager } from './miniMapVisibilityManager'

export class MiniMapChunkRenderer {
  private images: Map<string, Phaser.GameObjects.Image> = new Map()

  constructor(
    public visibilityManager: MiniMapVisibilityManager,
    public tileManager: MiniMapChunkManager,
    private chunkSize: number,
    private scene: Phaser.Scene,
  ) {
    // TODO: unsubscribe on destroy
    visibilityManager.subscribe(this.updateVisibility.bind(this))
  }

  private updateVisibility(
    newlyVisibleTiles: string[],
    newlyHiddenTiles: string[],
    colorMap: ColorMapper,
  ) {
    newlyVisibleTiles.forEach((key) => {
      const { x: chunkX, y: chunkY } = parseKey(key)

      // ColorMapper coordinates need to be translated relative to the chunk
      // they belong in.
      const translatedColorMap = (x: number, y: number) =>
        colorMap(x + chunkX * this.chunkSize, y + chunkY * this.chunkSize)
      const tile = this.tileManager.createChunk(key, translatedColorMap)

      const image = this.scene.add
        .image(chunkX * this.chunkSize, chunkY * this.chunkSize, tile.texture)
        .setOrigin(0, 0)
      this.images.set(key, image)
    })

    newlyHiddenTiles.forEach((key) => {
      const image = this.images.get(key)
      if (image) {
        image.destroy()
        this.images.delete(key)
      }
    })
  }
}

const parseKey = (key: string) => {
  const [x, y] = key.split(',').map(Number)
  return { x, y }
}
