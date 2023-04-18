import 'phaser'
import particleUrl from '/assets/particle.png'
import gaspUrl from '/assets/gasp.mp3'
import { testWorld } from 'src/entities/world'
import { grey, red } from 'src/utils/colors'
import { Scenes } from './sceneOrchestrator'
import { OrchestratableScene } from './orchestratableScene'

export const editorSceneName = 'EditorScene'

export class EntityEditorScene extends OrchestratableScene {
  private startKey!: Phaser.Input.Keyboard.Key
  private sprites: { s: Phaser.GameObjects.Image; r: number }[] = []
  private world = testWorld
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super(Scenes.EDITOR)
  }

  preload(): void {
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.startKey.isDown = false
    this.load.image('particle', particleUrl)
    this.load.audio('gasp', gaspUrl)
  }

  create(): void {
    this.add.text(0, 0, 'Press S to restart scene', {
      fontSize: '60px',
      fontFamily: 'Helvetica',
    })

    this.cameras.main.setBounds(0, 0, this.world.width, this.world.height)
    this.cursors = this.input.keyboard.createCursorKeys()

    this.add.image(100, 100, 'particle')
    this.add.grid(
      this.world.width / 2,
      this.world.height / 2,
      this.world.width,
      this.world.height,
      undefined,
      undefined,
      grey,
      undefined,
      red,
    )

    for (let i = 0; i < 300; i++) {
      const x = Phaser.Math.Between(-64, 800)
      const y = Phaser.Math.Between(-64, 600)

      const image = this.add.image(x, y, 'particle')
      image.setBlendMode(Phaser.BlendModes.ADD)
      this.sprites.push({ s: image, r: 2 + Math.random() * 6 })
    }
  }

  update(): void {
    super.update()
    if (this.startKey.isDown) {
      this.sound.play('gasp')
    }

    if (this.cursors?.down.isDown) {
      this.cameras.main.scrollY += 5
    }

    if (this.cursors?.up.isDown) {
      this.cameras.main.scrollY -= 5
    }

    for (let i = 0; i < this.sprites.length; i++) {
      const sprite = this.sprites[i].s

      sprite.y -= this.sprites[i].r

      if (sprite.y < -256) {
        sprite.y = 1000
      }
    }
  }
}
