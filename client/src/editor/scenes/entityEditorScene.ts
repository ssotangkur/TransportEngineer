import 'phaser'
// Tilesheets need to be extruded to avoid bleeding around the edges issue
import tilesheetUrl from '/assets/tiles/tilesheet_complete_2X_extruded.png'
import gaspUrl from '/assets/gasp.mp3'
import { Scenes } from './sceneOrchestrator'
import { OrchestratableScene } from './orchestratableScene'
import { MapControl } from 'src/inputs/mapControls'
import { MapSystem } from 'src/systems/mapSystem'
import { createWorld } from 'bitecs'
import { SpriteSystem } from 'src/systems/spriteSystem'
import { ShooterSpawnSystem } from './shooterSpawnSystem'

export const editorSceneName = 'EditorScene'
export const SPRITE_SPEED = 0.5

type EditorSceneWorld = {
  time: number
  delta: number
}

export class EntityEditorScene extends OrchestratableScene {
  private startKey!: Phaser.Input.Keyboard.Key
  private mapControl?: MapControl
  private mapSystem: MapSystem
  private sprite?: Phaser.GameObjects.Sprite
  private worldTarget = new Phaser.Math.Vector2()
  private world: EditorSceneWorld

  private spriteSystem
  private spawnSystem

  constructor() {
    super(Scenes.EDITOR)
    this.mapSystem = new MapSystem(this, tilesheetUrl, '/assets/tiles/te.json')
    this.world = createWorld({ time: 0, delta: 0 })

    this.spawnSystem = new ShooterSpawnSystem(this, this.world)
    this.spriteSystem = new SpriteSystem(this, this.spawnSystem.world)
  }

  preload(): void {
    this.mapSystem.preload()

    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.startKey.isDown = false

    this.load.audio('gasp', gaspUrl)

    // this.load.atlas('sprites', 'assets/sprites/shooter.png', 'assets/sprites/shooter.json')
    this.spawnSystem.preload()
    this.spriteSystem.preload()
  }

  create(): void {
    // this.add.image(0, 0, 'tilesheet')
    this.mapSystem.create()
    this.mapControl = new MapControl(this, this.mapSystem)

    this.sprite = this.add.sprite(100, 300, 'sprites', 'soldier1_gun.png')

    // remember where the target is
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // this.mapSystem.map?.worldToTileXY(pointer.worldX, pointer.worldY, false, this.tileTarget)
      this.worldTarget.set(pointer.worldX, pointer.worldY)
    })

    this.spawnSystem.create()
    this.spriteSystem.create()
  }

  update(time: number, delta: number): void {
    super.update(time, delta)

    // Apply the controls to the camera each update tick of the game
    this.mapControl?.update(time, delta)

    this.worldTarget.clone()

    const speedVec = this.worldTarget.clone().subtract(this.sprite!).normalize().scale(SPRITE_SPEED)
    this.sprite!.x += speedVec.x
    this.sprite!.y += speedVec.y

    this.spawnSystem.update(time, delta)
    this.spriteSystem.update(time, delta)
  }
}
