import { describe, expect, it } from 'vitest'
import { ChunkableQuadTree, QUAD_TREE_CHUNK_SIZE } from './chunkableQuadTree'
import { AABB } from '../aabb'
import { createWorld } from 'bitecs'
import { addEntityAt, moveEntity } from 'src/test/utils'

describe('chunkableQuadTree', () => {
  it('Can add an entity', () => {
    const world = createWorld({})
    const eid = addEntityAt(world, 0, 0, 1, 1)
    const tree = new ChunkableQuadTree(4, 8)
    tree.add(eid)

    const found = new Set<number>()
    tree.find(new AABB(0, 0, 1, 1), found)
    expect(Array.from(found).sort()).toEqual([eid])
  })

  it('Can remove an entity', () => {
    const world = createWorld({})
    const eid = addEntityAt(world, 0, 0, 1, 1)
    const tree = new ChunkableQuadTree(4, 8)
    tree.add(eid)
    tree.remove(eid)

    const found = new Set<number>()
    tree.find(new AABB(0, 0, 1, 1), found)
    expect(Array.from(found).sort()).toEqual([])
  })

  it('Can update an entity within bounds', () => {
    const world = createWorld({})
    const eid = addEntityAt(world, 0, 0, 1, 1)
    const tree = new ChunkableQuadTree(4, 8)
    tree.add(eid)

    moveEntity(eid, QUAD_TREE_CHUNK_SIZE - 1, QUAD_TREE_CHUNK_SIZE - 1)
    tree.update(eid)

    // Didn't find in old location
    const found = new Set<number>()
    tree.find(new AABB(0, 0, 1, 1), found)
    expect(Array.from(found).sort()).toEqual([])

    // Found in new location
    tree.find(new AABB(QUAD_TREE_CHUNK_SIZE - 1, QUAD_TREE_CHUNK_SIZE - 1, 1, 1), found)
    expect(Array.from(found).sort()).toEqual([eid])
  })

  it('Can update an entity outside bounds', () => {
    const world = createWorld({})
    const eid = addEntityAt(world, 0, 0, 1, 1)
    const tree = new ChunkableQuadTree(4, 8)
    tree.add(eid)

    moveEntity(eid, QUAD_TREE_CHUNK_SIZE + 1, QUAD_TREE_CHUNK_SIZE + 1)
    tree.update(eid)

    // Didn't find in old location
    const found = new Set<number>()
    tree.find(new AABB(0, 0, 1, 1), found)
    expect(Array.from(found).sort()).toEqual([])

    // Found in new location
    found.clear()
    tree.find(new AABB(QUAD_TREE_CHUNK_SIZE + 1, QUAD_TREE_CHUNK_SIZE + 1, 1, 1), found)
    expect(Array.from(found).sort()).toEqual([eid])

    // Remove the entity
    tree.remove(eid)

    // Didn't find in new location
    found.clear()
    tree.find(new AABB(QUAD_TREE_CHUNK_SIZE + 1, QUAD_TREE_CHUNK_SIZE + 1, 1, 1), found)
    expect(Array.from(found).sort()).toEqual([])
  })
})
