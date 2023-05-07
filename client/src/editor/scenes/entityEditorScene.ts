import 'phaser'
// Tilesheets need to be extruded to avoid bleeding around the edges issue
import tilesheetUrl from '/assets/tiles/tilesheet_complete_2X_extruded.png'
import gaspUrl from '/assets/gasp.mp3'
import { Scenes } from './sceneOrchestrator'
import { OrchestratableScene } from './orchestratableScene'
import { MapControl } from 'src/systems/mapControlSystem'
import { MapInfoWorld, MapSystem } from 'src/systems/mapSystem'
import { createWorld } from 'bitecs'
import { SpriteAngleSystem, SpriteSystem } from 'src/systems/spriteSystem'
import { ShooterSpawnSystem } from '../../systems/shooterSpawnSystem'
import { SystemBuilderClass } from 'src/systems/baseSystem'
import {
  PlayerFollowCursorSystem,
  PlayerMovementSystem,
  PlayerSpawnSystem,
} from 'src/systems/playerSystem'
import { TileToWorldTranslationSystem } from 'src/systems/coordinateTranslationSystem'
import { DebugSystem } from 'src/systems/debugSystem'

export const editorSceneName = 'EditorScene'
export const SPRITE_SPEED = 0.5

export class EntityEditorScene extends OrchestratableScene {
  private startKey!: Phaser.Input.Keyboard.Key
  private sprite?: Phaser.GameObjects.Sprite
  private worldTarget = new Phaser.Math.Vector2()
  private world

  // private mapSystem
  // private spriteSystem
  // private spawnSystem

  private systems

  constructor() {
    super(Scenes.EDITOR)

    this.world = createWorld({
      time: 0,
      delta: 0,
      mapInfoWorld: {
        tilesheetUrl,
        tilemapJsonPath: '/assets/tiles/te.json',
      },
    })

    this.systems = new SystemBuilderClass(this, this.world)
      .build(MapSystem)
      .build(MapControl)
      .build(ShooterSpawnSystem)
      .build(PlayerSpawnSystem)
      .build(PlayerFollowCursorSystem)
      .build(PlayerMovementSystem)
      .build(TileToWorldTranslationSystem)
      .build(SpriteSystem)
      .build(SpriteAngleSystem)
      // .build(DebugSystem)
      .instances()
  }

  preload(): void {
    this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.startKey.isDown = false

    this.load.audio('gasp', gaspUrl)

    this.systems.forEach((system) => system.preload())
  }

  create(): void {
    this.sprite = this.add.sprite(100, 300, 'sprites', 'soldier1_gun.png')

    // remember where the target is
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // this.mapSystem.map?.worldToTileXY(pointer.worldX, pointer.worldY, false, this.tileTarget)
      this.worldTarget.set(pointer.worldX, pointer.worldY)
    })

    // this.spawnSystem.create()
    // this.spriteSystem.create()
    this.systems.forEach((system) => system.create())
  }

  update(time: number, delta: number): void {
    super.update(time, delta)

    // Apply the controls to the camera each update tick of the game

    this.worldTarget.clone()

    const speedVec = this.worldTarget.clone().subtract(this.sprite!).normalize().scale(SPRITE_SPEED)
    this.sprite!.x += speedVec.x
    this.sprite!.y += speedVec.y

    // this.spawnSystem.update(time, delta)
    // this.spriteSystem.update(time, delta)
    this.systems.forEach((system) => system.update(time, delta))
  }
}
