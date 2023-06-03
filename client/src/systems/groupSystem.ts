import {
  IWorld,
  addComponent,
  addEntity,
  defineQuery,
  enterQuery,
  exitQuery,
  removeEntity,
} from 'bitecs'
import { BaseSystem } from './baseSystem'
import { MapWorld } from './mapSystem'
import { GroupComponent } from 'src/components/groupComponent'
import { TilePositionComponent, WorldPositionComponent } from 'src/components/positionComponent'
import { TextureWorld } from './textureSystem'
import { removeComponent } from 'bitecs'

export const GROUP_CIRCLE_RADIUS = 0.25 // in Tile coord

export type GroupRenderingWorld = {
  groupRenderingWorld: {
    circleEntities: Map<number, number>
  }
}

export class GroupRenderingSystem<WorldIn extends MapWorld & TextureWorld> extends BaseSystem<
  MapWorld & TextureWorld,
  WorldIn,
  GroupRenderingWorld
> {
  private groupQuery = defineQuery([GroupComponent])
  private groupEnter = enterQuery(this.groupQuery)
  private groupExit = exitQuery(this.groupQuery)

  createWorld(worldIn: MapWorld): GroupRenderingWorld {
    return {
      groupRenderingWorld: {
        circleEntities: new Map(),
      },
    }
  }

  update() {
    const circles = this.world.groupRenderingWorld.circleEntities

    this.forEidIn(this.groupEnter, (eid) => {
      // When we see an entity added to a group, create the circle entity

      const x = WorldPositionComponent.x[eid]
      const y = WorldPositionComponent.y[eid]

      circles.set(eid, this._addSelectionCircleEntity(eid, x, y))
    })

    this.forEidIn(this.groupQuery, (eid) => {
      const x = WorldPositionComponent.x[eid]
      const y = WorldPositionComponent.y[eid]

      const selectedCircleEid = this.world.groupRenderingWorld.circleEntities.get(eid)
      if (selectedCircleEid) {
        WorldPositionComponent.x[selectedCircleEid] = x
        WorldPositionComponent.y[selectedCircleEid] = y
      }
      // this.world.mapSystem.map?.getLayer(this.world.mapSystem.map?.currentLayerIndex).
    })

    this.forEidIn(this.groupExit, (eid) => {
      const circleEid = circles.get(eid)
      // TODO object pool instead of destroy

      circles.delete(eid)
      if (circleEid !== undefined) {
        this._removeSelectionCircleEntity(circleEid)
      }
    })
  }

  _addSelectionCircleEntity(eid: number, x: number, y: number) {
    const selectionCircleEid = addEntity(this.world)
    addComponent(this.world, WorldPositionComponent, selectionCircleEid)
    WorldPositionComponent.x[selectionCircleEid] = x
    WorldPositionComponent.y[selectionCircleEid] = y
    this.world.textureWorld.textureManager.setRingTexture(selectionCircleEid, eid)
    return selectionCircleEid
  }

  _removeSelectionCircleEntity(eid: number) {
    removeEntity(this.world, eid)
  }
}
