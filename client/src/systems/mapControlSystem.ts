import { MapWorld } from 'src/systems/mapSystem'
import { BaseSystem } from './baseSystem'
import { TimeWorld } from './timeSystem'
import { MySmoothedKeyControl } from 'src/utils/mySmoothedKeyControl'
import { SingletonWorld } from './singletonSystem'
import { addComponent } from 'bitecs'
import { DebugMapComponent, DebugMapMode, next } from 'src/components/debugMapComponent'

export type MapControlWorld = {
  mapControl: {
    camera?: Phaser.Cameras.Scene2D.Camera
    cursors?: Phaser.Types.Input.Keyboard.CursorKeys
    controls?: Phaser.Cameras.Controls.SmoothedKeyControl
  }
}

export type DoubleClickWorld = {
  doubleClick: {
    _lastPointerUpTime: number
    _doubleClickSubscribers: Set<(pointer: Phaser.Input.Pointer) => void>
    onDoubleClick: (listener: (pointer: Phaser.Input.Pointer) => void) => () => void
  }
}

export class MapControl<WorldIn extends MapWorld & TimeWorld & SingletonWorld> extends BaseSystem<
  MapWorld & TimeWorld & SingletonWorld,
  WorldIn,
  MapControlWorld
> {
  createWorld(_worldIn: MapWorld) {
    const mapControlWorld: MapControlWorld = {
      mapControl: {},
    }
    return mapControlWorld
  }

  create() {
    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.scene.cameras.main
    // Set up the arrows to control the camera
    const cursors = this.scene.input.keyboard!.createCursorKeys()
    // const controls = new Phaser.Cameras.Controls.SmoothedKeyControl({
    const controls = new MySmoothedKeyControl({
      camera: camera,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      acceleration: 2.0,
      drag: 0.5,
      maxSpeed: 1000.0,
      zoomIn: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      zoomOut: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
      zoomSpeed: 0.02,
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
        this.debug('Zoom: ' + camera.zoom)

        if (deltaY > 0) {
          // Making zoom strength proportional to current zoom feels more natural
          var newZoom = camera.zoom - 0.01 * camera.zoom
          if (newZoom > 0.1) {
            camera.zoom = newZoom
          }
        }

        if (deltaY < 0) {
          // Making zoom strength proportional to current zoom feels more natural
          var newZoom = camera.zoom + 0.01 * camera.zoom
          if (newZoom < 4.0) {
            camera.zoom = newZoom
          }
        }
      },
    )

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !pointer.middleButtonDown()) return

      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom
    })

    // Update the MapDebugComponent singleton
    const singletonEid = this.world.singleton.eid
    addComponent(this.world, DebugMapComponent, singletonEid)
    DebugMapComponent.mode[singletonEid] = DebugMapMode.Off
    const mKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M)
    mKey.on('up', () => {
      DebugMapComponent.mode[singletonEid] = next(DebugMapComponent.mode[singletonEid])
    })

    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    if (this.world.mapSystem.map) {
      //let { width, height } = this.scene.sys.game.scale.gameSize
      camera.useBounds = true
      // camera.setBounds(
      //   -width,
      //   -height,
      //   this.world.mapSystem.map.widthInPixels + 20 * width,
      //   this.world.mapSystem.map.heightInPixels + 20 * height,
      // )
      camera.setBounds(
        0,
        0,
        this.world.mapSystem.map.widthInPixels,
        this.world.mapSystem.map.heightInPixels,
      )
    }
  }

  update(_time: number, delta: number): void {
    // Apply the controls to the camera each update tick of the game
    this.world.mapControl.controls?.update(delta)
  }
}
