import 'phaser'
// Tilesheets need to be extruded to avoid bleeding around the edges issue
import tilesheetUrl from '/assets/tiles/tilesheet_complete_2X_extruded.png'
import gaspUrl from '/assets/gasp.mp3'
import { Scenes } from './sceneOrchestrator'
import { OrchestratableScene } from './orchestratableScene'
import { MapControl } from 'src/inputs/mapControls'
import { MapSystem } from 'src/maps/mapSystem'

export const editorSceneName = 'EditorScene'

export class EntityEditorScene extends OrchestratableScene {
  private startKey!: Phaser.Input.Keyboard.Key
  private mapControl?: MapControl
  private mapSystem: MapSystem

  constructor() {
    super(Scenes.EDITOR)
    this.mapSystem = new MapSystem(this, tilesheetUrl, '/assets/tiles/te.json')
  }

  preload(): void {
    this.mapSystem.preload()

    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.startKey.isDown = false

    this.load.audio('gasp', gaspUrl)
  }

  create(): void {
    // this.add.image(0, 0, 'tilesheet')
    this.mapSystem.create()
    this.mapControl = new MapControl(this, this.mapSystem)

    // this.add.text(0, 0, 'Press S to restart scene', {
    //   fontSize: '60px',
    //   fontFamily: 'Helvetica',
    // })
  }

  update(time: number, delta: number): void {
    super.update(time, delta)

    // Apply the controls to the camera each update tick of the game
    this.mapControl?.update(time, delta)
  }
}
