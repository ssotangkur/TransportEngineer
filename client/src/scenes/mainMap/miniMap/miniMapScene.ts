import { subUnsub } from 'src/utils/subUnsub'

export class MiniMapScene extends Phaser.Scene {
  private renderTexture: Phaser.GameObjects.RenderTexture | undefined
  private created: boolean = false

  constructor() {
    super({
      key: 'miniMap',
      cameras: {
        x: 0,
        y: 0,
        width: 256,
        height: 256,
        zoom: 1,
        scrollX: 0,
        scrollY: 0,
      },
    })
  }

  init() {
    subUnsub(this, 'miniMapUpdated', (data) => {
      if (!this.renderTexture) {
        // Exit if we haven't initialized yet
        return
      }
      for (let r = data.rect.y; r < data.rect.height; r++) {
        for (let c = data.rect.x; c < data.rect.width; c++) {
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
    // Object.values(DebugMapMode).forEach((mode) => {
    //   if (mode === DebugMapMode.Off) {
    //     return
    //   }
    //   this.renderTextures[mode] = this.add.renderTexture(0, 0).setVisible(false).setDepth(10000)
    // })
    this.renderTexture = this.add
      .renderTexture(0, 0, 256, 256)
      .setVisible(true)
      .setDepth(10000)
      .setScale(8)
    this.created = true
  }
}
