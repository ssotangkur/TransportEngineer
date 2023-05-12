import { BaseSystem } from './baseSystem'
import {
  IWorld,
  Types,
  addComponent,
  addEntity,
  defineComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  removeComponent,
  removeEntity,
} from 'bitecs'
import { MapWorld } from './mapSystem'
import { PlayerComponent } from 'src/components/playerComponent'
import { SpriteComponent } from 'src/components/spriteComponent'
import { SPRITE_NAME_TO_ID_MAP } from './spriteSystem'
import {
  AngleComponent,
  SpatialComponent,
  SpeedComponent,
  TileMoveComponent,
  TilePositionComponent,
  TileTargetComponent,
} from 'src/components/positionComponent'
import { DoubleClickWorld } from './mapControlSystem'
import { SpatialWorld } from './spatialSystem'

const playerQuery = defineQuery([PlayerComponent])

const playerTargetQuery = defineQuery([PlayerComponent, TileTargetComponent])

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
    SpriteComponent.spriteKey[eid] = 0
    addComponent(this.world, TilePositionComponent, eid)
    TilePositionComponent.x[eid] = 3.5
    TilePositionComponent.y[eid] = 5.5
    addComponent(this.world, SpeedComponent, eid)
    SpeedComponent.speed[eid] = 1
    addComponent(this.world, AngleComponent, eid)
    AngleComponent.radians[eid] = 0
    addComponent(this.world, SpatialComponent, eid)

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

export class PlayerMovementSystem<WorldIn extends DoubleClickWorld & MapWorld> extends BaseSystem<
  DoubleClickWorld & MapWorld,
  WorldIn,
  IWorld
> {
  // Create all temp variables once and keep reusing them so we never GC
  private pos = new Phaser.Math.Vector2(0, 0)
  private target = new Phaser.Math.Vector2(0, 0)

  createWorld(worldIn: WorldIn): IWorld {
    // On double-click, create Movement for Player
    worldIn.doubleClick.onDoubleClick((pointer) => {
      this.debug('double-click')
      this.forEidIn(playerQuery, (eid) => {
        if (!worldIn.mapSystem.map) {
          return
        }
        // bitECE makes this idempotent
        addComponent(worldIn, TileTargetComponent, eid)

        TileTargetComponent.x[eid] = worldIn.mapSystem.map.worldToTileX(pointer.worldX, false)
        TileTargetComponent.y[eid] = worldIn.mapSystem.map.worldToTileY(pointer.worldY, false)
      })
    })
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

      const deltaVec = this.target.subtract(this.pos)
      const deltaLenSq = deltaVec.lengthSq()
      const speedVec = deltaVec.normalize().scale(speed * delta * 0.001)

      // Set angle to match movement vector
      AngleComponent.radians[eid] = deltaVec.angle()

      // Add the move component so we have a place to move to
      addComponent(this.world, TileMoveComponent, eid)

      // If our movement is greater that the distance to our target just update the position
      // with the target instead
      if (speedVec.lengthSq() > deltaLenSq) {
        TileMoveComponent.x[eid] = TileTargetComponent.x[eid]
        TileMoveComponent.y[eid] = TileTargetComponent.y[eid]
        // Remove our target since we don't need it anymore
        removeComponent(this.world, TileTargetComponent, eid)
        return
      }

      this.pos.add(speedVec)
      TileMoveComponent.x[eid] = this.pos.x
      TileMoveComponent.y[eid] = this.pos.y
    })
    this.world
  }
}

/**
 * For a Target waypoint entity, we need a way to refer back to the entity this depends on.
 */
export const TargetReferenceComponent = defineComponent({ referenceEntity: Types.eid })
const targetReferenceQuery = defineQuery([TargetReferenceComponent])

/**
 * Create a target for a player when they enter
 * Updates their target to the cursor
 */
export class ShowPlayerWaypointSystem<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  IWorld
> {
  // Define enter/exit queries locally do they don't accidentally get reused by something else
  private playerTargetEnter = enterQuery(playerTargetQuery)
  private playerTargetExit = exitQuery(playerTargetQuery)

  createWorld(_worldIn: MapWorld): IWorld {
    return {}
  }

  update(_time: number, _delta: number) {
    // When player gets a target, the target itself needs it's own entity which we create here
    // We then need a component to reference the original entity so we know when to remove it.
    this.forEidIn(this.playerTargetEnter, (refEid) => {
      const eid = addEntity(this.world)
      addComponent(this.world, TargetReferenceComponent, eid)
      TargetReferenceComponent.referenceEntity[eid] = refEid

      addComponent(this.world, SpriteComponent, eid)
      SpriteComponent.spriteId[eid] = 47
      SpriteComponent.spriteKey[eid] = 1
      addComponent(this.world, TilePositionComponent, eid)
      TilePositionComponent.x[eid] = TileTargetComponent.x[refEid]
      TilePositionComponent.y[eid] = TileTargetComponent.y[refEid]

      this.debug('New target entity ' + eid)
    })

    // Update the targetEntity's position always
    this.forEidIn(targetReferenceQuery, (eid) => {
      const refEid = TargetReferenceComponent.referenceEntity[eid]
      TilePositionComponent.x[eid] = TileTargetComponent.x[refEid]
      TilePositionComponent.y[eid] = TileTargetComponent.y[refEid]
    })

    // console.log('num target entities=' + targetReferenceQuery(this.world).length)

    // this.forEidIn(targetReferenceQuery, (targetEid) => {
    //   const playerEid = TargetReferenceComponent.referenceEntity[targetEid]
    //   hasComponent(this.world, TileTargetComponent, playerEid)
    // })

    // Since targets will hang with the player for a while
    // we wait till they lose the target to do something.
    // When the player loses the target, we find all entities and see
    // if they match the refEid, if they do we can remove the eid that
    // holds the refEid
    const playersLosingTargets = this.playerTargetExit(this.world)
    if (playersLosingTargets.length > 0) {
      const refEntities = new Map(
        targetReferenceQuery(this.world).map((targetEid) => [
          TargetReferenceComponent.referenceEntity[targetEid],
          targetEid,
        ]),
      )
      playersLosingTargets.forEach((playerEid) => {
        const targetEid = refEntities.get(playerEid)
        if (!targetEid) return
        removeEntity(this.world, targetEid)
        this.debug('Remove target entity ' + targetEid)
      })
    }
  }
}
