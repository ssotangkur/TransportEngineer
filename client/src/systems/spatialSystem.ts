import { defineQuery, enterQuery, exitQuery } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { MapWorld } from './mapSystem'
import {
  SpatialComponent,
  TilePositionComponent,
  WorldPositionComponent,
} from 'src/components/positionComponent'
import { SpriteComponent } from 'src/components/spriteComponent'
import { ChunkComponent } from 'src/components/chunkComponent'
import { QuadTree } from 'src/utils/quadTree'
import { ChunkInfo, chunkKey, ChunkWorld, getChunkForWorldPosition } from './chunkVisibilitySystem'
import { key2d } from 'src/utils/keys'
import { CHUNK_SIZE } from 'src/constants'

export type SpatialWorld = {
  spatialWorld: {
    chunksToTreeMap: Map<string, QuadTree>
    find: (searchRect: Phaser.Geom.Rectangle) => number[]
  }
}

export const spatialQuery = defineQuery([SpatialComponent, WorldPositionComponent, SpriteComponent])

const chunkQuery = defineQuery([ChunkComponent])
const chunkEnter = enterQuery(chunkQuery)
const chunkExit = exitQuery(chunkQuery)

const throwError = () => {
  throw new Error(`Function called before initialization.`)
}

export class SpatialSystem<WorldIn extends MapWorld & ChunkWorld> extends BaseSystem<
  MapWorld & ChunkWorld,
  WorldIn,
  SpatialWorld
> {
  private spatialEnter = enterQuery(spatialQuery)
  private spatialExit = exitQuery(spatialQuery)

  private chunkInfo?: ChunkInfo

  createWorld(): SpatialWorld {
    return {
      spatialWorld: {
        chunksToTreeMap: new Map(),
        find: throwError,
      },
    }
  }

  create(): void {
    this.subUnsub('chunkInfoUpdated', (chunkInfo) => {
      this.onChunkInfoUpdate(chunkInfo)
    })
  }

  onChunkInfoUpdate(chunkInfo: ChunkInfo) {
    this.chunkInfo = chunkInfo

    this.world.spatialWorld.find = (searchRect: Phaser.Geom.Rectangle) => {
      // Find all chunks that intersect the search rect
      const { getChunkForWorldPosition, chunkKey } = chunkInfo
      const minChunk = getChunkForWorldPosition(searchRect.x, searchRect.y)
      const maxChunk = getChunkForWorldPosition(
        searchRect.x + searchRect.width,
        searchRect.y + searchRect.height,
      )

      const chunkXMin = minChunk.x
      const chunkXMax = maxChunk.x
      const chunkYMin = minChunk.y
      const chunkYMax = maxChunk.y

      const found: number[] = []
      for (let x = chunkXMin; x <= chunkXMax; x++) {
        for (let y = chunkYMin; y <= chunkYMax; y++) {
          const key = chunkKey(x, y)
          const tree = this.world.spatialWorld.chunksToTreeMap.get(key)
          if (tree) {
            found.push(...tree.findEntities(searchRect))
          }
        }
      }

      return found
    }
  }

  preload(): void {}

  update(_time: number, _delta: number): void {
    if (this.chunkInfo) {
      this.forEidIn(this.spatialEnter, (eid) => {
        // Add entity
        const x = WorldPositionComponent.x[eid]
        const y = WorldPositionComponent.y[eid]

        const key = this.world.chunkSystem.chunkInfo.chunkKey(x, y)
      })
    }

    this.forEidIn(spatialQuery, (eid) => {
      const x = TilePositionComponent.x[eid]
      const y = TilePositionComponent.y[eid]
      const worldWidth = SpriteComponent.width[eid]
      const worldHeight = SpriteComponent.height[eid]
      const width = this.world.mapSystem.mapInfo.worldToTileX(worldWidth) ?? 0
      const height = this.world.mapSystem.mapInfo.worldToTileY(worldHeight) ?? 0
      client.position.set(x, y)
      client.dimensions = [width, height]
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

const QUAD_TREE_CHUNK_SIZE = 256
const INV_QUAD_TREE_CHUNK_SIZE = 1 / QUAD_TREE_CHUNK_SIZE
/**
 * Note: These chunks can be different than the ones in the tileset
 */
export class ChunkableQuadTree {
  private chunksToTreeMap: Map<number, QuadTree> = new Map()

  constructor(
    private maxPerNode: number,
    private maxDepth: number,
    private tileWidth: number,
    private tileHeight: number,
  ) {}

  add(eid: number) {
    const { chunkX, chunkY } = this.getChunkForWorldPosition(
      WorldPositionComponent.x[eid],
      WorldPositionComponent.y[eid],
    )
    const key = key2d(chunkX, chunkY)
    let tree = this.chunksToTreeMap.get(key)
    if (!tree) {
      tree = new QuadTree(
        new Phaser.Geom.Rectangle(
          chunkX * QUAD_TREE_CHUNK_SIZE,
          chunkY * QUAD_TREE_CHUNK_SIZE,
          QUAD_TREE_CHUNK_SIZE,
          QUAD_TREE_CHUNK_SIZE,
        ),
        this.maxPerNode,
        this.maxDepth,
      )
      this.chunksToTreeMap.set(key, tree)
    }
    tree.addEntity(eid)
  }

  remove(eid: number) {
    const { chunkX, chunkY } = this.getChunkForWorldPosition(
      WorldPositionComponent.x[eid],
      WorldPositionComponent.y[eid],
    )
    const key = key2d(chunkX, chunkY)
    const tree = this.chunksToTreeMap.get(key)
    tree?.removeEntity(eid)

    // @TODO: remove empty chunks
  }

  find(rect: Phaser.Geom.Rectangle, foundEntities: Set<number>) {
    // find all chunks that intersect the search rect
    const minChunk = this.getChunkForWorldPosition(rect.x, rect.y)
    const maxChunk = this.getChunkForWorldPosition(rect.x + rect.width, rect.y + rect.height)

    const chunkXMin = minChunk.chunkX
    const chunkXMax = maxChunk.chunkX
    const chunkYMin = minChunk.chunkY
    const chunkYMax = maxChunk.chunkY

    for (let x = chunkXMin; x <= chunkXMax; x++) {
      for (let y = chunkYMin; y <= chunkYMax; y++) {
        const key = key2d(x, y)
        const tree = this.chunksToTreeMap.get(key)
        tree?.findEntities(rect, foundEntities)
      }
    }
  }

  getChunkForWorldPosition(x: number, y: number) {
    const chunkX = Math.floor(x * INV_QUAD_TREE_CHUNK_SIZE)
    const chunkY = Math.floor(y * INV_QUAD_TREE_CHUNK_SIZE)
    return { chunkX, chunkY }
  }
}
