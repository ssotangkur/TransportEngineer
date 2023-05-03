import { MapSystem } from 'src/maps/mapSystem'

export class MapControl {
  private camera: Phaser.Cameras.Scene2D.Camera
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private controls: Phaser.Cameras.Controls.FixedKeyControl
  // private input:

  constructor(private scene: Phaser.Scene, private map: MapSystem) {
    // Phaser supports multiple cameras, but you can access the default camera like this:
    this.camera = scene.cameras.main
    // Set up the arrows to control the camera
    this.cursors = scene.input.keyboard.createCursorKeys()
    this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: this.camera,
      left: this.cursors.left,
      right: this.cursors.right,
      up: this.cursors.up,
      down: this.cursors.down,
      speed: 0.5,
      zoomIn: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
      zoomOut: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      zoomSpeed: 0.002,
    })

    this.scene.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: any,
        _deltaX: number,
        deltaY: number,
        _deltaZ: number,
      ) => {
        if (deltaY > 0) {
          var newZoom = this.camera.zoom - 0.1
          if (newZoom > 0.1) {
            this.camera.zoom = newZoom
          }
        }

        if (deltaY < 0) {
          var newZoom = this.camera.zoom + 0.1
          if (newZoom < 1.3) {
            this.camera.zoom = newZoom
          }
        }
      },
    )

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return

      this.camera.scrollX -= (pointer.x - pointer.prevPosition.x) / this.camera.zoom
      this.camera.scrollY -= (pointer.y - pointer.prevPosition.y) / this.camera.zoom
    })

    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    // let { width, height } = scene.sys.game.scale.gameSize
    // this.camera.setBounds(
    //   -width,
    //   -height,
    //   this.map.widthInPixels + 20 * width,
    //   this.map.heightInPixels + 20 * height,
    // )
  }

  update(_time: number, delta: number): void {
    // Apply the controls to the camera each update tick of the game
    this.controls?.update(delta)
  }
}
