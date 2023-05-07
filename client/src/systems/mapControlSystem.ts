import { MapWorld } from 'src/systems/mapSystem'
import { BaseSystem } from './baseSystem'

export type MapControlWorld = {
  mapControl: {
    camera?: Phaser.Cameras.Scene2D.Camera
    cursors?: Phaser.Types.Input.Keyboard.CursorKeys
    controls?: Phaser.Cameras.Controls.FixedKeyControl
  }
}

export type CursorPositionWorld = {
  cursorPosition: {
    worldX?: number
    worldY?: number
    tileX?: number
    tileY?: number
  }
}

export class MapControl<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  MapControlWorld & CursorPositionWorld
> {
  createWorld(_worldIn: MapWorld) {
    const mapControlWorld: MapControlWorld & CursorPositionWorld = {
      mapControl: {},
      cursorPosition: {},
    }
    return mapControlWorld
  }

  create() {
    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.scene.cameras.main
    // Set up the arrows to control the camera
    const cursors = this.scene.input.keyboard.createCursorKeys()
    const controls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: camera,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      speed: 0.5,
      zoomIn: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
      zoomOut: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      zoomSpeed: 0.002,
    })
    this.world.mapControl.camera = camera
    this.world.mapControl.cursors = cursors
    this.world.mapControl.controls = controls

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
      },
    )

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Store current cursor position in our world for others to use
      this.world.cursorPosition.worldX = pointer.worldX
      this.world.cursorPosition.worldY = pointer.worldY
      this.world.cursorPosition.tileX = this.world.mapSystem.map?.worldToTileX(
        pointer.worldX,
        false,
      ) // Need false to get inter-tile precision
      this.world.cursorPosition.tileY = this.world.mapSystem.map?.worldToTileY(
        pointer.worldY,
        false,
      )

      if (!pointer.isDown) return

      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom
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
    this.world.mapControl.controls?.update(delta)
  }
}
