import { IWorld, defineQuery, enterQuery, exitQuery } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { Bounds, Client, Dimensions, SpatialHashGrid } from 'src/utils/spatialHashGrid/spatial-grid'
import { MapWorld } from './mapSystem'
import { SpatialComponent, TilePositionComponent } from 'src/components/positionComponent'

export type SpatialWorld = {
  spatialWorld: {
    spatialHashGrid?: SpatialHashGrid
    clients: Map<number, Client>
  }
}

export const spatialQuery = defineQuery([SpatialComponent, TilePositionComponent])

/**
 * Initializes the Spatial Grid but doesn't do any processing
 */
export class SpatialSystemInit<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  SpatialWorld
> {
  createWorld(): SpatialWorld {
    return {
      spatialWorld: {
        clients: new Map(),
      },
    }
  }

  update() {
    const map = this.world.mapSystem.map
    if (!map) {
      return
    }
    if (this.world.spatialWorld.spatialHashGrid) {
      return
    }

    const bounds: Bounds = []
    bounds[0] = [0, 0]
    bounds[1] = [map!.width, map!.height]
    const dimensions: Dimensions = [map!.width, map!.height]
    const grid = new SpatialHashGrid(bounds, dimensions)
    this.world.spatialWorld.spatialHashGrid = grid
  }
}

export class SpatialSystem<WorldIn extends SpatialWorld> extends BaseSystem<
  SpatialWorld,
  WorldIn,
  IWorld
> {
  private spatialEnter = enterQuery(spatialQuery)
  private spatialExit = exitQuery(spatialQuery)

  createWorld() {
    return {}
  }

  update(_time: number, _delta: number): void {
    const grid = this.world.spatialWorld.spatialHashGrid
    if (!grid) {
      return
    }
    const clients = this.world.spatialWorld.clients

    this.forEidIn(this.spatialEnter, (eid) => {
      const x = TilePositionComponent.x[eid]
      const y = TilePositionComponent.y[eid]
      // Hardcode dimensions for now
      const client = grid.NewClient([x, y], [0.5, 0.5])
      if (client) {
        clients.set(eid, client)
      }
    })

    this.forEidIn(spatialQuery, (eid) => {
      const client = clients.get(eid)
      if (!client) {
        return
      }
      const x = TilePositionComponent.x[eid]
      const y = TilePositionComponent.y[eid]
      client.position[0] = x
      client.position[1] = y
      grid.UpdateClient(client)
    })

    this.forEidIn(this.spatialExit, (eid) => {
      const client = clients.get(eid)
      if (!client) {
        return
      }
      grid.Remove(client)
    })
  }
}
