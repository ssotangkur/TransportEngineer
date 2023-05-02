import 'phaser'
import particleUrl from '/assets/particle.png'
// Tilesheets need to be extruded to avoid bleeding around the edges issue
import tilesheetUrl from '/assets/tiles/tilesheet_complete_2X_extruded.png'
// import tilemapUrl from '/assets/tiles/untitled.tmx'
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

  private controls: Phaser.Cameras.Controls.FixedKeyControl | undefined

  constructor() {
    super(Scenes.EDITOR)
  }

  preload(): void {
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.startKey.isDown = false
    this.load.image('tiles', tilesheetUrl)
    this.load.tilemapTiledJSON('map', '/assets/tiles/te.json')
    this.load.audio('gasp', gaspUrl)
  }

  create(): void {
    // this.add.image(0, 0, 'tilesheet')
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('tileset', 'tiles')
    map.createLayer('Tile Layer 1', tileset)

    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.cameras.main

    // Set up the arrows to control the camera
    const cursors = this.input.keyboard.createCursorKeys()
    this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: camera,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      speed: 0.5,
      zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
      zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      zoomSpeed: 0.002,
    })

    this.input.on(
      'wheel',
      (
        pointer: Phaser.Input.Pointer,
        gameObjects: any,
        deltaX: number,
        deltaY: number,
        deltaZ: number,
      ) => {
        if (deltaY > 0) {
          var newZoom = camera.zoom - 0.1
          if (newZoom > 0.1) {
            camera.zoom = newZoom
          }
        }

        if (deltaY < 0) {
          var newZoom = camera.zoom + 0.1
          if (newZoom < 1.3) {
            camera.zoom = newZoom
          }
        }

        // this.camera.centerOn(pointer.worldX, pointer.worldY);
        // this.camera.pan(pointer.worldX, pointer.worldY, 2000, "Power2");
      },
    )

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return

      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom
    })

    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    // this.add.text(0, 0, 'Press S to restart scene', {
    //   fontSize: '60px',
    //   fontFamily: 'Helvetica',
    // })

    // this.cameras.main.setBounds(0, 0, this.world.width, this.world.height)
    // this.cursors = this.input.keyboard.createCursorKeys()

    // this.add.image(100, 100, 'particle')
    // this.add.grid(
    //   this.world.width / 2,
    //   this.world.height / 2,
    //   this.world.width,
    //   this.world.height,
    //   undefined,
    //   undefined,
    //   grey,
    //   undefined,
    //   red,
    // )

    // for (let i = 0; i < 300; i++) {
    //   const x = Phaser.Math.Between(-64, 800)
    //   const y = Phaser.Math.Between(-64, 600)

    //   const image = this.add.image(x, y, 'particle')
    //   image.setBlendMode(Phaser.BlendModes.ADD)
    //   this.sprites.push({ s: image, r: 2 + Math.random() * 6 })
    // }
  }

  update(time: number, delta: number): void {
    super.update(time, delta)
    if (this.startKey.isDown) {
      this.sound.play('gasp')
    }

    // Apply the controls to the camera each update tick of the game
    this.controls?.update(delta)

    // for (let i = 0; i < this.sprites.length; i++) {
    //   const sprite = this.sprites[i].s

    //   sprite.y -= this.sprites[i].r

    //   if (sprite.y < -256) {
    //     sprite.y = 1000
    //   }
    // }
  }
}
