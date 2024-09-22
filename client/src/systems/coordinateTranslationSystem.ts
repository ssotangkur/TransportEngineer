import {
  IWorld,
  addComponent,
  defineQuery,
  enterQuery,
  exitQuery,
  hasComponent,
  removeComponent,
} from 'bitecs'
import { BaseSystem } from './baseSystem'
import { MapWorld } from './mapSystem'
import {
  TilePositionComponent,
  TileTargetComponent,
  WorldPositionComponent,
  WorldTargetComponent,
} from 'src/components/positionComponent'

const tilePositionQuery = defineQuery([TilePositionComponent])
const tilePositionEnter = enterQuery(tilePositionQuery)
const tilePositionExit = exitQuery(tilePositionQuery)

const tileTargetQuery = defineQuery([TileTargetComponent])
const tileTargetEnter = enterQuery(tileTargetQuery)
const tileTargetExit = exitQuery(tileTargetQuery)

export class TileToWorldTranslationSystem<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  IWorld
> {
  createWorld(_worldIn: MapWorld): IWorld {
    return {}
  }

  update() {
    const posEnterEids = tilePositionEnter(this.world)
    posEnterEids.forEach((eid) => {
      addComponent(this.world, WorldPositionComponent, eid)
    })

    const mapInfo = this.world.mapSystem.mapInfo
    if (mapInfo.tileSetInfo != undefined) {
      const posEids = tilePositionQuery(this.world)
      posEids.forEach((eid) => {
        WorldPositionComponent.x[eid] = mapInfo.tileToWorldX(TilePositionComponent.x[eid])!
        WorldPositionComponent.y[eid] = mapInfo.tileToWorldX(TilePositionComponent.y[eid])!
      })
    }

    const posExitEids = tilePositionExit(this.world)
    posExitEids.forEach((eid) => {
      if (hasComponent(this.world, WorldPositionComponent, eid)) {
        removeComponent(this.world, WorldPositionComponent, eid)
      }
    })

    const targetEnterEids = tileTargetEnter(this.world)
    targetEnterEids.forEach((eid) => {
      addComponent(this.world, WorldTargetComponent, eid)
    })

    if (mapInfo.tileSetInfo != undefined) {
      const targetEids = tileTargetQuery(this.world)
      targetEids.forEach((eid) => {
        WorldTargetComponent.x[eid] = mapInfo.tileToWorldX(TileTargetComponent.x[eid])!
        WorldTargetComponent.y[eid] = mapInfo.tileToWorldX(TileTargetComponent.y[eid])!
      })
    }

    const targetExitEids = tileTargetExit(this.world)
    targetExitEids.forEach((eid) => {
      removeComponent(this.world, TileTargetComponent, eid)
    })
  }
}
