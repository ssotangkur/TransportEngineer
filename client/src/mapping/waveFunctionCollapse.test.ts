import { describe, it, expect } from 'vitest'
import {
  CollapsibleCell,
  PossibleTilesMap,
  adjCellCoordinates,
  getLowestEntropy,
  rowColKey,
} from './waveFunctionCollapse'
import { Adjacency } from './adjacency'

describe('PossibleTilesMap', () => {
  it('constructs possibleTilesMap', () => {
    const example = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    const possible = new PossibleTilesMap(3, 3, example)

    const allValues = [1, 2, 3, 4, 5, 6]
    expect(possible.getPossibleTiles(0, 0).possibleNumbers).toEqual([1])
    expect(possible.getPossibleTiles(0, 1).possibleNumbers).toEqual([1, 2, 3])
    expect(possible.getPossibleTiles(0, 2).possibleNumbers).toEqual([3])
    expect(possible.getPossibleTiles(1, 0).possibleNumbers).toEqual([1, 4])
    expect(possible.getPossibleTiles(1, 1).possibleNumbers).toEqual(allValues)
    expect(possible.getPossibleTiles(1, 2).possibleNumbers).toEqual([3, 6])
    expect(possible.getPossibleTiles(2, 0).possibleNumbers).toEqual([4])
    expect(possible.getPossibleTiles(2, 1).possibleNumbers).toEqual([4, 5, 6])
    expect(possible.getPossibleTiles(2, 2).possibleNumbers).toEqual([6])
  })

  it('propagates correctly', () => {
    const example = [
      [1, 3, 2, 1],
      [2, 2, 2, 3],
      [3, 2, 3, 2],
      [1, 3, 2, 1],
    ]
    const possible = new PossibleTilesMap(3, 3, example)
    possible.print()

    // manually collapse 0, 0
    const cell = possible.possibleTiles[0][0]
    cell.collapsed = true
    cell.possibleNumbers = [3]
    const modified = new Set<string>([rowColKey(0, 0)])
    const cellsToCheck = adjCellCoordinates(0, 0)

    possible.propagate(modified, cellsToCheck)
    possible.print()
    console.log('Modified')
    console.log(modified)
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
