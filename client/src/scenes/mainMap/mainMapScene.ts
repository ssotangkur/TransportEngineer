import 'phaser'
// Tilesheets need to be extruded to avoid bleeding around the edges issue
import tilesheetUrl from '/assets/tiles/tilesheet_complete_2X_extruded.png'
import { OrchestratableScene } from '../orchestratableScene'
import { MapControl } from 'src/systems/mapControlSystem'
import { MapSystem } from 'src/systems/mapSystem'
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
import { AccelVizSystem } from 'src/systems/debugSystem'
import { TimeSystem } from 'src/systems/timeSystem'
import { SpatialSystem } from 'src/systems/spatialSystem'
import {
  AccelerationResolutionSystem,
  MoveComponentRemovalSystem,
  MoveResolutionSystem,
} from 'src/systems/movementSystem'
import { BoidSystem } from 'src/systems/boidSystem'
import { GroupRenderingSystem } from 'src/systems/groupSystem'
import { TextureSystem } from 'src/systems/textureSystem'
import { SingletonSystem } from 'src/systems/singletonSystem'
import { MouseSystem } from 'src/systems/mouseSystem'
import { DebugMapSystem } from 'src/systems/debugMapSystem'
import { ChunkVisibilitySystem } from 'src/systems/chunkVisibilitySystem'
import { ChunkRenderingSystem } from 'src/systems/chunkRenderingSystem'
import { UpdateTimerSystem } from 'src/systems/updateTimerSystem'
import { MapUIScene } from 'src/scenes/mainMap/mapUI/mapUIScene'
import { MiniMapScene } from './miniMap/miniMapScene'

export const editorSceneName = 'EditorScene'
export const SPRITE_SPEED = 0.5

export class MainMapScene extends OrchestratableScene {
  private world

  private systems

  constructor() {
    super('editor', [MapUIScene, MiniMapScene]) // Add dependent scenes here

    this.world = createWorld({
      time: 0,
      delta: 0,
      mapInfoWorld: {
        tilesheetUrl,
        tilemapJsonPath: '/assets/tiles/te.json',
      },
    })

    this.systems = new SystemBuilderClass(this, this.world)
      .build(SingletonSystem)
      .build(TimeSystem)
      .build(UpdateTimerSystem)
      .build(MouseSystem)
      .build(TextureSystem)
      .build(MapSystem)
      .build(ChunkVisibilitySystem)
      .build(ChunkRenderingSystem)
      .build(MapControl)
      .build(ShooterSpawnSystem)
      .build(PlayerSpawnSystem)
      // .build(PlayerFollowCursorSystem)
      .build(PlayerMovementSystem)
      .build(ShowPlayerWaypointSystem)
      .build(SpatialSystem)
      .build(BoidSystem)
      .build(AccelerationResolutionSystem)
      .build(MoveResolutionSystem)
      .build(TileToWorldTranslationSystem)
      .build(SpriteSystem)
      .build(SpriteAngleSystem)
      .build(AccelVizSystem)
      .build(GroupRenderingSystem)
      .build(MoveComponentRemovalSystem)
      // .build(DebugSystem)
      .build(DebugMapSystem)
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
