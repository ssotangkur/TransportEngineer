import { MapWorld } from 'src/systems/mapSystem'
import { BaseSystem } from './baseSystem'
import { TimeWorld } from './timeSystem'

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

export type DoubleClickWorld = {
  doubleClick: {
    _lastPointerUpTime: number
    _doubleClickSubscribers: Set<(pointer: Phaser.Input.Pointer) => void>
    onDoubleClick: (listener: (pointer: Phaser.Input.Pointer) => void) => () => void
  }
}

export const DOUBLE_CLICK_THRESHOLD = 500 // in ms

export class MapControl<WorldIn extends MapWorld & TimeWorld> extends BaseSystem<
  MapWorld & TimeWorld,
  WorldIn,
  MapControlWorld & CursorPositionWorld & DoubleClickWorld
> {
  createWorld(_worldIn: MapWorld) {
    const doubleClickSubscribers = new Set<(pointer: Phaser.Input.Pointer) => void>()
    const onDoubleClick = (listener: (pointer: Phaser.Input.Pointer) => void) => {
      doubleClickSubscribers.add(listener)
      return () => {
        doubleClickSubscribers.delete(listener)
      }
    }

    const mapControlWorld: MapControlWorld & CursorPositionWorld & DoubleClickWorld = {
      mapControl: {},
      cursorPosition: {},
      doubleClick: {
        _lastPointerUpTime: 0,
        _doubleClickSubscribers: doubleClickSubscribers,
        onDoubleClick,
      },
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

    // Disable browswer default right button context menu
    this.scene.input.mouse.disableContextMenu()

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

      if (!pointer.isDown || !pointer.middleButtonDown()) return

      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom
    })

    // Handle Double-click processing
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.debug(
        `lastPtrUp=${this.world.doubleClick._lastPointerUpTime} world.time=${this.world.time}`,
      )
      if (this.world.doubleClick._lastPointerUpTime + DOUBLE_CLICK_THRESHOLD > this.world.time) {
        // double click occured
        this.world.doubleClick._doubleClickSubscribers.forEach((callback) => callback(pointer))
      }
      this.world.doubleClick._lastPointerUpTime = this.world.time
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
