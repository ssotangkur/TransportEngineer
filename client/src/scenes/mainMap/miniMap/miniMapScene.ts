import { subUnsub } from 'src/utils/subUnsub'
import { MiniMapChunkManager } from './miniMapChunkManager'
import { MiniMapVisibilityManager } from './miniMapVisibilityManager'
import { MiniMapChunkRenderer } from './miniMapChunkRenderer'
import { AABB } from 'src/utils/aabb'

const MINI_MAP_WIDTH = 256
const MINI_MAP_HEIGHT = 256

const TILE_SIZE = 16

export class MiniMapScene extends Phaser.Scene {
  private renderTexture: Phaser.GameObjects.RenderTexture | undefined
  private created: boolean = false
  private texture: Phaser.Textures.Texture | undefined | null
  private rectangle: Phaser.GameObjects.Rectangle | undefined

  private miniMapTileManager: MiniMapChunkManager | undefined
  private miniMapVisibilityManager: MiniMapVisibilityManager | undefined
  private miniMapChunkRenderer: MiniMapChunkRenderer | undefined

  constructor() {
    super({
      key: 'miniMap',
    })
  }

  init() {
    subUnsub(this, 'miniMapUpdated', ({ rect, colorMap }) => {
      if (!this.renderTexture || !this.miniMapVisibilityManager) {
        // Exit if we haven't initialized yet
        return
      }

      const center = rect.centerPoint()

      // The rect for our minimap is centered on the rect, but has the size of MINI_MAP_WIDTH x MINI_MAP_HEIGHT
      const miniMapRect = new AABB(
        center.x - MINI_MAP_WIDTH / 2,
        center.y - MINI_MAP_HEIGHT / 2,
        MINI_MAP_WIDTH,
        MINI_MAP_HEIGHT,
      )
      this.miniMapVisibilityManager.updateVisibility(miniMapRect, colorMap)

      this.cameras.main.centerOn(center.x, center.y).setVisible(true)

      if (!this.rectangle) {
        this.rectangle = this.add.rectangle(
          center.x,
          center.y,
          rect.width,
          rect.height,
          undefined,
          0,
        )
        this.rectangle.setStrokeStyle(1.55, 0xffffff, 1)
        this.rectangle.setDepth(2)
      } else {
        // update the rectangle
        this.rectangle.setPosition(center.x, center.y)
        this.rectangle.setSize(rect.width, rect.height)
      }
    })
  }

  create() {
    if (this.created) {
      return
    }
    this.created = true

    this.cameras.main
      .setViewport(300, 0, MINI_MAP_WIDTH, MINI_MAP_HEIGHT)
      .centerOn(-MINI_MAP_WIDTH / 2, -MINI_MAP_HEIGHT / 2)
      .setVisible(true)
    this.renderTexture = this.add
      .renderTexture(0, 0)
      .setSize(MINI_MAP_WIDTH, MINI_MAP_HEIGHT)
      .setVisible(true)
      .setDepth(1)

    this.texture = this.textures.addUint8Array(
      'miniMap',
      new Uint8Array(MINI_MAP_WIDTH * MINI_MAP_HEIGHT * 4),
      MINI_MAP_WIDTH,
      MINI_MAP_HEIGHT,
    )
    if (this.texture === null) {
      throw new Error('Could not create texture')
    }
    this.renderTexture?.setTexture('miniMap')

    this.miniMapTileManager = new MiniMapChunkManager(TILE_SIZE, this.textures)
    this.miniMapVisibilityManager = new MiniMapVisibilityManager(TILE_SIZE)
    this.miniMapChunkRenderer = new MiniMapChunkRenderer(
      this.miniMapVisibilityManager,
      this.miniMapTileManager,
      TILE_SIZE,
      this,
    )
  }
}
