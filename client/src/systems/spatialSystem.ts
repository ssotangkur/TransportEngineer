import { defineQuery, enterQuery, exitQuery } from 'bitecs'
import { BaseSystem } from './baseSystem'
import {
  Bounds,
  Client,
  Dimensions,
  SpatialHashGrid,
} from 'src/utils/spatialHashGrid/spatialHashGrid'
import { MapWorld } from './mapSystem'
import { SpatialComponent, TilePositionComponent } from 'src/components/positionComponent'

export type SpatialWorld = {
  spatialWorld: {
    spatialHashGrid?: SpatialHashGrid
    clients: Map<number, Client>
  }
}

export const spatialQuery = defineQuery([SpatialComponent, TilePositionComponent])

export class SpatialSystem<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  SpatialWorld
> {
  private spatialEnter = enterQuery(spatialQuery)
  private spatialExit = exitQuery(spatialQuery)

  createWorld(): SpatialWorld {
    return {
      spatialWorld: {
        clients: new Map(),
      },
    }
  }

  create(): void {
    const map = this.world.mapSystem.map
    if (!map) {
      throw Error('Map is not found')
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
      const client = grid.NewClient(eid, new Phaser.Math.Vector2(x, y), [0.5, 0.5])
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
      client.position.set(x, y)
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
