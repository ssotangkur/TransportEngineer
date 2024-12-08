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
      const tile = this.tileManager.createChunk(key, colorMap)
      const { x, y } = parseKey(key)
      const image = this.scene.add.image(x * this.chunkSize, y * this.chunkSize, tile.texture)
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
