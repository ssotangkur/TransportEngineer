import { BaseSystem } from './baseSystem'
import {
  IWorld,
  addComponent,
  addEntity,
  defineQuery,
  enterQuery,
  exitQuery,
  removeComponent,
} from 'bitecs'
import { MapWorld } from './mapSystem'
import { PlayerComponent } from 'src/components/playerComponent'
import { SpriteComponent } from 'src/components/spriteComponent'
import { SPRITE_NAME_TO_ID_MAP } from './spriteSystem'
import {
  AngleComponent,
  SpeedComponent,
  TilePositionComponent,
  TileTargetComponent,
} from 'src/components/positionComponent'
import { CursorPositionWorld } from './mapControlSystem'

export class PlayerSpawnSystem<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  IWorld
> {
  createWorld(_worldIn: WorldIn): IWorld {
    return {}
  }

  create() {
    const eid = addEntity(this.world)
    addComponent(this.world, PlayerComponent, eid)
    addComponent(this.world, SpriteComponent, eid)
    SpriteComponent.spriteId[eid] = SPRITE_NAME_TO_ID_MAP.get('soldier1_gun.png') ?? 0
    addComponent(this.world, TilePositionComponent, eid)
    TilePositionComponent.x[eid] = 3.5
    TilePositionComponent.y[eid] = 5.5
    addComponent(this.world, SpeedComponent, eid)
    SpeedComponent.speed[eid] = 1
    addComponent(this.world, AngleComponent, eid)
    AngleComponent.radians[eid] = 0

    // this.sprite = this.add.sprite(100, 300, 'sprites', 'soldier1_gun.png')
  }
}

const playerMovementQuery = defineQuery([
  PlayerComponent,
  TilePositionComponent,
  TileTargetComponent,
  SpeedComponent,
  AngleComponent,
])

export class PlayerMovementSystem<WorldIn extends IWorld> extends BaseSystem<
  IWorld,
  WorldIn,
  IWorld
> {
  // Create all temp variables once and keep reusing them so we never GC
  private pos = new Phaser.Math.Vector2(0, 0)
  private target = new Phaser.Math.Vector2(0, 0)

  createWorld(_worldIn: WorldIn): IWorld {
    return {}
  }

  update(_time: number, delta: number) {
    const playerEids = playerMovementQuery(this.world)
    playerEids.forEach((eid) => {
      this.pos.x = TilePositionComponent.x[eid]
      this.pos.y = TilePositionComponent.y[eid]
      this.target.x = TileTargetComponent.x[eid]
      this.target.y = TileTargetComponent.y[eid]
      const speed = SpeedComponent.speed[eid]

      const speedVec = this.target
        .subtract(this.pos)
        .normalize()
        .scale(speed * delta * 0.001)
      this.pos.add(speedVec)

      AngleComponent.radians[eid] = speedVec.angle()

      TilePositionComponent.x[eid] = this.pos.x
      TilePositionComponent.y[eid] = this.pos.y
    })
    this.world
  }
}

const playerQuery = defineQuery([PlayerComponent])
const playerEnterQuery = enterQuery(playerQuery)
const playerExitQuery = exitQuery(playerQuery)
const playerTargetQuery = defineQuery([PlayerComponent, TilePositionComponent])

/**
 * Create a target for a player when they enter
 * Updates their target to the cursor
 */
export class PlayerFollowCursorSystem<
  WorldIn extends MapWorld & CursorPositionWorld,
> extends BaseSystem<MapWorld & CursorPositionWorld, WorldIn, IWorld> {
  createWorld(_worldIn: MapWorld & CursorPositionWorld): IWorld {
    return {}
  }

  update(_time: number, _delta: number) {
    const newPlayerEids = playerEnterQuery(this.world)
    newPlayerEids.forEach((eid) => {
      // Add target comp for new players
      addComponent(this.world, TileTargetComponent, eid)
    })

    const playersWithTargets = playerTargetQuery(this.world)
    playersWithTargets.forEach((eid) => {
      TileTargetComponent.x[eid] = this.world.cursorPosition.tileX ?? 0
      TileTargetComponent.y[eid] = this.world.cursorPosition.tileY ?? 0
    })

    const exitPlayerEids = playerExitQuery(this.world)
    exitPlayerEids.forEach((eid) => {
      // Remove target comp for exiting players
      removeComponent(this.world, TileTargetComponent, eid)
    })
  }
}
