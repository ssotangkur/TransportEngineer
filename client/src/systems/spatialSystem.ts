import { defineQuery, enterQuery, exitQuery, IWorld } from 'bitecs'
import { BaseSystem } from './baseSystem'
import {
  SpatialComponent,
  TilePositionComponent,
  WorldPositionComponent,
} from 'src/components/positionComponent'
import { SpriteComponent } from 'src/components/spriteComponent'
import { AABB, aabbByCenter } from 'src/utils/aabb'
import { ChunkableQuadTree } from 'src/utils/quadTrees/chunkableQuadTree'

export interface SpatialDataStruct {
  add: (eid: number, aabb: AABB) => void
  remove: (eid: number) => void
  find: (searchRect: AABB, foundEntities: Set<number>) => void
  update: (eid: number, aabb: AABB) => void
}

export type SpatialWorld = {
  spatialWorld: {
    spatialStruct: SpatialDataStruct
  }
}

export const spatialQuery = defineQuery([SpatialComponent, WorldPositionComponent, SpriteComponent])

export class SpatialSystem<WorldIn extends IWorld> extends BaseSystem<
  IWorld,
  WorldIn,
  SpatialWorld
> {
  private spatialEnter = enterQuery(spatialQuery)
  private spatialExit = exitQuery(spatialQuery)

  createWorld(): SpatialWorld {
    return {
      spatialWorld: {
        spatialStruct: new ChunkableQuadTree(4, 8),
      },
    }
  }

  preload(): void {}

  update(_time: number, _delta: number): void {

    const spatial = this.world.spatialWorld.spatialStruct

    this.forEidIn(this.spatialEnter, (eid) => {
      const x = WorldPositionComponent.x[eid]
      const y = WorldPositionComponent.y[eid]
      const worldWidth = SpriteComponent.width[eid]
      const worldHeight = SpriteComponent.height[eid]
      spatial.add(eid, aabbByCenter(x, y, worldWidth, worldHeight))
    })
    
    this.forEidIn(spatialQuery, (eid) => {
      const x = TilePositionComponent.x[eid]
      const y = TilePositionComponent.y[eid]
      const worldWidth = SpriteComponent.width[eid]
      const worldHeight = SpriteComponent.height[eid]
      spatial.update(eid, aabbByCenter(x, y, worldWidth, worldHeight))
    })

    this.forEidIn(this.spatialExit, (eid) => {
      spatial.remove(eid)
    })
  }
}

