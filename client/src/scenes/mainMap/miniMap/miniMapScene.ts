import { subUnsub } from 'src/utils/subUnsub'

const MINI_MAP_WIDTH = 400
const MINI_MAP_HEIGHT = 400

export class MiniMapScene extends Phaser.Scene {
  private renderTexture: Phaser.GameObjects.RenderTexture | undefined
  private created: boolean = false
  private texture: Phaser.Textures.Texture | undefined | null

  constructor() {
    super({
      key: 'miniMap',
      // cameras: {
      //   x: 0,
      //   y: 0,
      //   width: 256,
      //   height: 256,
      //   zoom: 1,
      //   scrollX: 0,
      //   scrollY: 0,
      // },
    })
  }

  init() {
    subUnsub(this, 'miniMapUpdated', (data) => {
      if (!this.renderTexture) {
        // Exit if we haven't initialized yet
        return
      }

      const pixels = new Uint8Array(MINI_MAP_WIDTH * MINI_MAP_HEIGHT * 4)
      for (let r = data.rect.y; r < MINI_MAP_HEIGHT; r++) {
        for (let c = data.rect.x; c < MINI_MAP_WIDTH; c++) {
          const color = Phaser.Display.Color.HexStringToColor(data.colorMap(r, c).color)
          const colorIdx = (r * MINI_MAP_WIDTH + c) * 4
          pixels[colorIdx] = color.red
          pixels[colorIdx + 1] = color.green
          pixels[colorIdx + 2] = color.blue
          pixels[colorIdx + 3] = 192
        }
      }

      this.texture?.source[0]?.glTexture?.update(
        pixels,
        MINI_MAP_WIDTH,
        MINI_MAP_HEIGHT,
        false,
        WebGL2RenderingContext.CLAMP_TO_EDGE,
        WebGL2RenderingContext.CLAMP_TO_EDGE,
        WebGL2RenderingContext.NEAREST,
        WebGL2RenderingContext.NEAREST,
        WebGL2RenderingContext.RGBA,
      )
    })
  }

  create() {
    if (this.created) {
      return
    }
    this.created = true

    this.cameras.main
      .setViewport(300, 0, MINI_MAP_WIDTH, MINI_MAP_HEIGHT)
      .setScroll(-MINI_MAP_WIDTH / 2, -MINI_MAP_HEIGHT / 2)
      .setVisible(true)
    this.renderTexture = this.add
      .renderTexture(0, 0)
      .setSize(MINI_MAP_WIDTH, MINI_MAP_HEIGHT)
      .setVisible(true)
      .setDepth(10000)

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
  }
}
