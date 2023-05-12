import 'phaser'
// Tilesheets need to be extruded to avoid bleeding around the edges issue
import tilesheetUrl from '/assets/tiles/tilesheet_complete_2X_extruded.png'
import { Scenes } from './sceneOrchestrator'
import { OrchestratableScene } from './orchestratableScene'
import { MapControl } from 'src/systems/mapControlSystem'
import { MapInfoWorld, MapSystem } from 'src/systems/mapSystem'
import { createWorld } from 'bitecs'
import { SpriteAngleSystem, SpriteSystem } from 'src/systems/spriteSystem'
import { ShooterSpawnSystem } from '../../systems/shooterSpawnSystem'
import { SystemBuilderClass } from 'src/systems/baseSystem'
import {
  // PlayerFollowCursorSystem,
  PlayerMovementSystem,
  PlayerSpawnSystem,
  ShowPlayerWaypointSystem,
} from 'src/systems/playerSystem'
import { TileToWorldTranslationSystem } from 'src/systems/coordinateTranslationSystem'
import { DebugSystem } from 'src/systems/debugSystem'
import { TimeSystem } from 'src/systems/timeSystem'
import { SpatialSystem } from 'src/systems/spatialSystem'
import { MoveComponentRemovalSystem, MoveResolutionSystem } from 'src/systems/movementSystem'
import { BoidComponent } from 'src/components/boidComponent'
import { BoidSystem } from 'src/systems/boidSystem'

export const editorSceneName = 'EditorScene'
export const SPRITE_SPEED = 0.5

export class EntityEditorScene extends OrchestratableScene {
  private world

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
      .build(TimeSystem)
      .build(MapSystem)
      .build(MapControl)
      .build(ShooterSpawnSystem)
      .build(PlayerSpawnSystem)
      // .build(PlayerFollowCursorSystem)
      .build(PlayerMovementSystem)
      .build(ShowPlayerWaypointSystem)
      .build(SpatialSystem)
      .build(BoidSystem)
      .build(MoveResolutionSystem)
      .build(TileToWorldTranslationSystem)
      .build(SpriteSystem)
      .build(SpriteAngleSystem)
      .build(MoveComponentRemovalSystem)
      // .build(DebugSystem)
      .instances()
  }

  preload(): void {
    this.systems.forEach((system) => system.preload())
  }

  create(): void {
    this.systems.forEach((system) => system.create())
  }

  update(time: number, delta: number): void {
    super.update(time, delta)
    this.systems.forEach((system) => system.update(time, delta))
  }
}
