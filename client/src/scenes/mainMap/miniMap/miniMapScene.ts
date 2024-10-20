import { subUnsub } from 'src/utils/subUnsub'

const MINI_MAP_WIDTH = 256
const MINI_MAP_HEIGHT = 256

export class MiniMapScene extends Phaser.Scene {
  private renderTexture: Phaser.GameObjects.RenderTexture | undefined
  private created: boolean = false

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
      for (let r = data.rect.y; r < MINI_MAP_HEIGHT; r++) {
        for (let c = data.rect.x; c < MINI_MAP_WIDTH; c++) {
          const color = Phaser.Display.Color.HexStringToColor(data.colorMap(r, c).color).color
          this.renderTexture.fill(color, undefined, c, r, 1, 1)
        }
      }
    })
  }

  create() {
    if (this.created) {
      return
    }
    this.cameras.main
      .setViewport(0, 0, MINI_MAP_WIDTH, MINI_MAP_HEIGHT)
      .setScroll(-MINI_MAP_WIDTH / 2, -MINI_MAP_HEIGHT / 2)
      .setVisible(true)
    // Object.values(DebugMapMode).forEach((mode) => {
    //   if (mode === DebugMapMode.Off) {
    //     return
    //   }
    //   this.renderTextures[mode] = this.add.renderTexture(0, 0).setVisible(false).setDepth(10000)
    // })
    this.renderTexture = this.add
      .renderTexture(0, 0)
      .setSize(MINI_MAP_WIDTH, MINI_MAP_HEIGHT)
      .setVisible(true)
      .setDepth(10000)
    this.created = true
  }
}
