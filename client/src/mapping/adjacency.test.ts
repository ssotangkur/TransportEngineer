import { describe, it, expect } from 'vitest'
import { Adjacency } from './adjacency'

describe('Adjacency', () => {
  it('creates an adjacency map for 1x1', () => {
    const a = new Adjacency([[1]])
    const adjTile = a.getAdjacencyTile(1)

    expect(adjTile).toBeDefined()
    expect(Array.from(adjTile!.up.values())).toEqual([-1])
    expect(Array.from(adjTile!.down.values())).toEqual([-1])
    expect(Array.from(adjTile!.left.values())).toEqual([-1])
    expect(Array.from(adjTile!.right.values())).toEqual([-1])
  })

  it('creates an adjacency map for 2x2', () => {
    const a = new Adjacency([
      [1, 2],
      [3, 4],
    ])
    const topLeftTile = a.getAdjacencyTile(1)
    expect(topLeftTile).toBeDefined()
    expect(Array.from(topLeftTile!.up.values())).toEqual([-1])
    expect(Array.from(topLeftTile!.down.values())).toEqual([3])
    expect(Array.from(topLeftTile!.left.values())).toEqual([-1])
    expect(Array.from(topLeftTile!.right.values())).toEqual([2])

    const topRightTile = a.getAdjacencyTile(2)
    expect(topLeftTile).toBeDefined()
    expect(Array.from(topRightTile!.up.values())).toEqual([-1])
    expect(Array.from(topRightTile!.down.values())).toEqual([4])
    expect(Array.from(topRightTile!.left.values())).toEqual([1])
    expect(Array.from(topRightTile!.right.values())).toEqual([-1])

    const bottomLeftTile = a.getAdjacencyTile(3)
    expect(topLeftTile).toBeDefined()
    expect(Array.from(bottomLeftTile!.up.values())).toEqual([1])
    expect(Array.from(bottomLeftTile!.down.values())).toEqual([-1])
    expect(Array.from(bottomLeftTile!.left.values())).toEqual([-1])
    expect(Array.from(bottomLeftTile!.right.values())).toEqual([4])

    const bottomRightTile = a.getAdjacencyTile(4)
    expect(topLeftTile).toBeDefined()
    expect(Array.from(bottomRightTile!.up.values())).toEqual([2])
    expect(Array.from(bottomRightTile!.down.values())).toEqual([-1])
    expect(Array.from(bottomRightTile!.left.values())).toEqual([3])
    expect(Array.from(bottomRightTile!.right.values())).toEqual([-1])
  })

  it('creates an adjacency map for 3x3 with repeats', () => {
    const a = new Adjacency([
      [1, 2, 1],
      [1, 3, 1],
      [2, 2, 2],
    ])

    const tile1 = a.getAdjacencyTile(1)
    expect(tile1).toBeDefined()
    expect(tile1!.up).toEqual(new Set([-1, 1]))
    expect(tile1!.down).toEqual(new Set([1, 2]))
    expect(tile1!.left).toEqual(new Set([-1, 2, 3]))
    expect(tile1!.right).toEqual(new Set([-1, 2, 3]))

    const tile2 = a.getAdjacencyTile(2)
    expect(tile2).toBeDefined()
    expect(tile2!.up).toEqual(new Set([-1, 1, 3]))
    expect(tile2!.down).toEqual(new Set([-1, 3]))
    expect(tile2!.left).toEqual(new Set([-1, 2, 1]))
    expect(tile2!.right).toEqual(new Set([-1, 1, 2]))

    const tile3 = a.getAdjacencyTile(3)
    expect(tile3).toBeDefined()
    expect(tile3!.up).toEqual(new Set([2]))
    expect(tile3!.down).toEqual(new Set([2]))
    expect(tile3!.left).toEqual(new Set([1]))
    expect(tile3!.right).toEqual(new Set([1]))
  })

  it('returns usedTileNumbers', () => {
    const a = new Adjacency([
      [1, 2, 1],
      [1, 3, 1],
      [2, 2, 2],
    ])
    expect(a.getUsedTileNumbers()).toEqual(new Set([1, 2, 3]))
  })
})
