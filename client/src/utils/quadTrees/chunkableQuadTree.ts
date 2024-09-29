import { WorldPositionComponent } from "src/components/positionComponent"
import { AABB } from "../aabb"
import { QuadTree } from "./quadTree"
import { SpatialDataStruct } from "src/systems/spatialSystem"

const QUAD_TREE_CHUNK_SIZE = 256
const INV_QUAD_TREE_CHUNK_SIZE = 1 / QUAD_TREE_CHUNK_SIZE
/**
 * Note: These chunks can be different than the ones in the tileset
 */
export class ChunkableQuadTree implements SpatialDataStruct{
  private chunksToTreeMap: Map<string, QuadTree> = new Map()
  private entityToChunkMap = new EntityChunkMapping()

  constructor(private maxPerNode: number, private maxDepth: number) {}

  chunkKey(x: number, y: number) {
    return `${x},${y}`
  }

  add(eid: number, aabb: AABB) {
    const center = aabb.centerPoint()
    const { chunkX, chunkY } = this.getChunkForWorldPosition(center.x, center.y)
    const key = this.chunkKey(chunkX, chunkY)
    let tree = this.chunksToTreeMap.get(key)
    if (!tree) {
      tree = new QuadTree(
        new AABB(
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
    this.entityToChunkMap.setEntityChunkMapping(eid, key)
  }

  remove(eid: number) {
    const { chunkX, chunkY } = this.getChunkForWorldPosition(
      WorldPositionComponent.x[eid],
      WorldPositionComponent.y[eid],
    )
    const key = this.chunkKey(chunkX, chunkY)
    const tree = this.chunksToTreeMap.get(key)
    tree?.removeEntity(eid)
    this.entityToChunkMap.removeEntityChunkMapping(eid)

    // @TODO: remove empty chunks
  }

  find(rect: AABB, foundEntities: Set<number>) {
    // find all chunks that intersect the search rect
    const minChunk = this.getChunkForWorldPosition(rect.x, rect.y)
    const maxChunk = this.getChunkForWorldPosition(rect.x + rect.width, rect.y + rect.height)

    const chunkXMin = minChunk.chunkX
    const chunkXMax = maxChunk.chunkX
    const chunkYMin = minChunk.chunkY
    const chunkYMax = maxChunk.chunkY

    for (let x = chunkXMin; x <= chunkXMax; x++) {
      for (let y = chunkYMin; y <= chunkYMax; y++) {
        const key = this.chunkKey(x, y)
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

  update(eid: number, aabb: AABB) {
    const center = aabb.centerPoint()
    const { chunkX, chunkY } = this.getChunkForWorldPosition(center.x, center.y)
    const key = this.chunkKey(chunkX, chunkY)

    const chunks = this.entityToChunkMap.get(eid)

    if (!chunks) {
      throw new Error("Trying to update entity, but it doesn't have a previous chunk")
    }

    // if entity's previous chunk is the same, we can just update it
    if (chunks?.includes(key)) {
      const tree = this.chunksToTreeMap.get(key)
      tree?.updateEntity(eid)
    } else {
      // else, we must remove it from the old chunk and add it to the new chunk
      for (const cKey of chunks) {
        const tree = this.chunksToTreeMap.get(cKey)
        tree?.removeEntity(eid)
      }
      this.add(eid, aabb)
    }
  }
}

class EntityChunkMapping {
  private entityToChunkMap = new Map<number, string[]>()

  setEntityChunkMapping(eid: number, chunkKey: string) {
    const chunks = this.entityToChunkMap.get(eid)
    if (!chunks) {
      this.entityToChunkMap.set(eid, [chunkKey])
      return
    }
    if (!chunks.includes(chunkKey)) {
      chunks.push(chunkKey)
    }
  }

  removeEntityChunkMapping(eid: number) {
    this.entityToChunkMap.delete(eid)
  }

  get(eid: number) {
    return this.entityToChunkMap.get(eid)
  }
}
