import { describe, it, expect } from 'vitest'
import {
  CollapsibleCell,
  PossibleTilesMap,
  RandomSampleState,
  getLowestEntropy,
} from './waveFunctionCollapse'
import { Adjacency } from './adjacency'
import _ from 'lodash'

describe('PossibleTilesMap', () => {
  it('constructs possibleTilesMap', () => {
    const example = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    const possible = new PossibleTilesMap(3, 2, example)

    expect(possible.getCell(0, 0).possibleNumbers).toEqual([1])
    expect(possible.getCell(0, 1).possibleNumbers).toEqual([2])
    expect(possible.getCell(0, 2).possibleNumbers).toEqual([3])
    expect(possible.getCell(1, 0).possibleNumbers).toEqual([4])
    expect(possible.getCell(1, 1).possibleNumbers).toEqual([5])
    expect(possible.getCell(1, 2).possibleNumbers).toEqual([6])
  })

  it('constructs possibleTilesMap with propagation', () => {
    const example = [
      [1, 2, 1, 2],
      [2, 4, 4, 1],
      [2, 4, 3, 1],
      [1, 1, 1, 1],
    ]
    const possible = new PossibleTilesMap(4, 4, example)

    expect(possible.getCell(0, 0).possibleNumbers).toEqual([1, 2]) // borders only 1 and 2
    expect(possible.getCell(1, 0).possibleNumbers).toEqual([1, 2])
    expect(possible.getCell(1, 1).possibleNumbers).toEqual([1, 2, 4]) // No 3 since 3 is never right of 1 or 2
    expect(possible.getCell(2, 2).possibleNumbers.sort()).toEqual([1, 2, 3, 4]) // 3 is possible since 3 can be right of 4
    expect(possible.getCell(3, 1).possibleNumbers).toEqual([1]) // only 1s are on the bottom row
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
    const cell = possible.getCell(0, 0)
    cell.collapsed = true
    cell.possibleNumbers = [3]

    console.log('Before')
    possible.print()

    possible.propagate(0, 0)

    console.log('After')
    possible.print()

    expect(possible.getCell(0, 0).possibleNumbers.sort()).toEqual([3])
    expect(possible.getCell(0, 1).possibleNumbers.sort()).toEqual([2])
    expect(possible.getCell(0, 2).possibleNumbers.sort()).toEqual([1, 2, 3])

    expect(possible.getCell(1, 0).possibleNumbers.sort()).toEqual([1, 2])
    expect(possible.getCell(1, 1).possibleNumbers.sort()).toEqual([1, 2, 3])
    expect(possible.getCell(1, 2).possibleNumbers.sort()).toEqual([1, 2, 3])

    expect(possible.getCell(2, 2).possibleNumbers.sort()).toEqual([1, 2, 3])
    expect(possible.getCell(2, 2).possibleNumbers.sort()).toEqual([1, 2, 3])
    expect(possible.getCell(2, 2).possibleNumbers.sort()).toEqual([1, 2, 3])
  })

  const sampleFirst = <T>(arr: T[]) => arr[0]
  const sampleLast = <T>(arr: T[]) => arr[arr.length - 1]
  const sampleExactly = (indices: number[]) => {
    let index = 0
    const f = <T>(arr: T[]) => {
      index = indices[index++ % indices.length]
      const ans = arr[index % arr.length]
      return ans
    }
    return f
  }

  it('collapses correctly', () => {
    const example = [
      [1, 3, 2, 1],
      [2, 2, 2, 3],
      [3, 2, 3, 2],
      [1, 3, 2, 1],
    ]
    const possible = new PossibleTilesMap(3, 3, example, sampleFirst)
    possible.print()

    possible.collapse()
    possible.print()
  })

  it('collapses w/ backtracking correctly', () => {
    const example = [
      [1, 1, 1, 1, 1, 1],
      [1, 2, 3, 3, 7, 1],
      [1, 2, 1, 1, 7, 1],
      [1, 2, 5, 5, 7, 1],
      [1, 1, 1, 1, 1, 1],
    ]
    const possible = new PossibleTilesMap(4, 4, example, sampleLast)
    possible.print()

    possible.collapse()
    possible.print()
  })

  it('collapseOnce twice and undo twice should result in same possible map', () => {
    const example = [
      [1, 1, 1, 1, 1, 1],
      [1, 2, 3, 3, 4, 1],
      [1, 9, 12, 13, 5, 1],
      [1, 9, 11, 14, 5, 1],
      [1, 8, 7, 7, 6, 1],
      [1, 1, 1, 1, 1, 1],
    ]
    const possible = new PossibleTilesMap(8, 8, example, sampleExactly([1]))
    possible.print()

    const prevPossibleTiles = _.cloneDeep(possible.possibleTiles)
    const prevCollapsedCount = possible.collapsedCount

    const rndSample1 = new RandomSampleState(4, 2, possible.getCell(4, 2), sampleExactly([1]))
    possible.collapseOnce(rndSample1)
    possible.print()

    const rndSample2 = new RandomSampleState(4, 4, possible.getCell(4, 4), sampleExactly([1]))
    possible.collapseOnce(rndSample2)
    possible.print()

    possible.undoRandomSample(rndSample2)
    possible.print()

    possible.undoRandomSample(rndSample1)
    possible.print()

    expect(prevPossibleTiles).deep.equals(possible.possibleTiles)
    expect(prevCollapsedCount).equals(possible.collapsedCount)
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
    expect(getLowestEntropy(a, entropyMap, 3, 2, _.sample)).toEqual([1, 1])
  })
})
