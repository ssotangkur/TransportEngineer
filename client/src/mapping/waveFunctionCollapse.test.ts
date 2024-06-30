import { describe, it, expect } from 'vitest'
import {
  CollapsibleCell,
  PossibleTilesMap,
  adjCellCoordinates,
  getLowestEntropy,
  rowColKey,
} from './waveFunctionCollapse'
import { Adjacency } from './adjacency'
import { UniqueArray } from 'src/utils/uniqueArray'

describe('PossibleTilesMap', () => {
  it('constructs possibleTilesMap', () => {
    const example = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    const possible = new PossibleTilesMap(3, 2, example)

    expect(possible.getPossibleTiles(0, 0).possibleNumbers).toEqual([1])
    expect(possible.getPossibleTiles(0, 1).possibleNumbers).toEqual([2])
    expect(possible.getPossibleTiles(0, 2).possibleNumbers).toEqual([3])
    expect(possible.getPossibleTiles(1, 0).possibleNumbers).toEqual([4])
    expect(possible.getPossibleTiles(1, 1).possibleNumbers).toEqual([5])
    expect(possible.getPossibleTiles(1, 2).possibleNumbers).toEqual([6])
  })

  it('constructs possibleTilesMap with propagation', () => {
    const example = [
      [1, 2, 1, 2],
      [2, 4, 4, 1],
      [2, 4, 3, 1],
      [1, 1, 1, 1],
    ]
    const possible = new PossibleTilesMap(4, 4, example)

    expect(possible.getPossibleTiles(0, 0).possibleNumbers).toEqual([1, 2]) // borders only 1 and 2
    expect(possible.getPossibleTiles(1, 0).possibleNumbers).toEqual([1, 2])
    expect(possible.getPossibleTiles(1, 1).possibleNumbers).toEqual([1, 2, 4]) // No 3 since 3 is never right of 1 or 2
    expect(possible.getPossibleTiles(2, 2).possibleNumbers.sort()).toEqual([1, 2, 3, 4]) // 3 is possible since 3 can be right of 4
    expect(possible.getPossibleTiles(3, 1).possibleNumbers).toEqual([1]) // only 1s are on the bottom row
  })

  it('propagates correctly', () => {
    const example = [
      [1, 3, 2, 1],
      [2, 2, 2, 3],
      [3, 2, 3, 2],
      [1, 3, 2, 1],
    ]
    const possible = new PossibleTilesMap(3, 3, example)

    // manually collapse 0, 0
    const cell = possible.possibleTiles[0][0]
    cell.collapsed = true
    cell.possibleNumbers = [3]
    const modified = new Set<string>([rowColKey(0, 0)])
    const cellsToCheck = new UniqueArray(adjCellCoordinates(0, 0))

    possible.propagate(modified, cellsToCheck)

    expect(possible.possibleTiles[0][0].possibleNumbers.sort()).toEqual([3])
    expect(possible.possibleTiles[0][1].possibleNumbers.sort()).toEqual([2])
    expect(possible.possibleTiles[0][2].possibleNumbers.sort()).toEqual([1, 2, 3])

    expect(possible.possibleTiles[1][0].possibleNumbers.sort()).toEqual([1, 2])
    expect(possible.possibleTiles[1][1].possibleNumbers.sort()).toEqual([1, 2, 3])
    expect(possible.possibleTiles[1][2].possibleNumbers.sort()).toEqual([1, 2, 3])

    expect(possible.possibleTiles[2][2].possibleNumbers.sort()).toEqual([1, 2, 3])
    expect(possible.possibleTiles[2][2].possibleNumbers.sort()).toEqual([1, 2, 3])
    expect(possible.possibleTiles[2][2].possibleNumbers.sort()).toEqual([1, 2, 3])
  })

  it('collapses correctly', () => {
    const example = [
      [1, 3, 2, 1],
      [2, 2, 2, 3],
      [3, 2, 3, 2],
      [1, 3, 2, 1],
    ]
    const possible = new PossibleTilesMap(3, 3, example)
    possible.print()

    possible.collapse()
    possible.print()
  })
})

describe('getLowestEntropy', () => {
  it('returns lowest entropy', () => {
    const a = new Adjacency([
      [1, 2],
      [3, 4],
    ])
    const high: CollapsibleCell = { possibleNumbers: [1, 2, 3, 4], collapsed: false }
    const low: CollapsibleCell = { possibleNumbers: [1, 2], collapsed: false }
    const entropyMap = [
      [high, high, high],
      [high, low, high],
    ]
    expect(getLowestEntropy(a, entropyMap, 3, 2)).toEqual([1, 1])
  })
})
