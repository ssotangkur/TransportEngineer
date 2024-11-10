import { subUnsub } from 'src/utils/subUnsub'

const MINI_MAP_WIDTH = 400
const MINI_MAP_HEIGHT = 400

export class MiniMapScene extends Phaser.Scene {
  private renderTexture: Phaser.GameObjects.RenderTexture | undefined
  private created: boolean = false
  private texture: Phaser.Textures.Texture | undefined | null
  private rectangle: Phaser.GameObjects.Rectangle | undefined

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

      const { rect, colorMap } = data
      const center = rect.centerPoint()
      const xStart = Math.floor(center.x - MINI_MAP_WIDTH / 2)
      const yStart = Math.floor(center.y - MINI_MAP_HEIGHT / 2)
      const xEnd = Math.floor(center.x + MINI_MAP_WIDTH / 2)
      const yEnd = Math.floor(center.y + MINI_MAP_HEIGHT / 2)

      const pixels = new Uint8Array(MINI_MAP_WIDTH * MINI_MAP_HEIGHT * 4)
      let colorIdx = 0
      for (let r = yStart; r < yEnd; r++) {
        for (let c = xStart; c < xEnd; c++) {
          const color = Phaser.Display.Color.HexStringToColor(colorMap(r, c).color)
          //const colorIdx = (r * MINI_MAP_WIDTH + c) * 4
          pixels[colorIdx++] = color.red
          pixels[colorIdx++] = color.green
          pixels[colorIdx++] = color.blue
          pixels[colorIdx++] = 192
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

      this.rectangle?.setPosition(center.x, center.y)
      this.rectangle?.setSize(rect.width, rect.height)
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

    this.rectangle = this.add.rectangle(0,0, 0, 0, undefined, 0)
    this.rectangle.setStrokeStyle(2, 0xffffff)
  }
}
