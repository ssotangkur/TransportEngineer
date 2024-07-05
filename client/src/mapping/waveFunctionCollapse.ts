import { UniqueArray } from 'src/utils/uniqueArray'
import {
  Adjacency,
  AdjacencyTile,
  BORDER_TILE_NUMBER,
  CARDINAL_DIRECTIONS,
  opposite,
} from './adjacency'
import _ from 'lodash'
import { duration } from 'moment'

export type CollapsibleCell = {
  possibleNumbers: number[]
  collapsed: boolean
}

export class RandomSampleState {
  public origCellState: CollapsibleCell // Cell will be replaced with this if all possibilities fail
  public tilesTried: number[] = []
  public tileChosen: number | undefined
  public undoPropagateStack: UndoPropagateStep[] = []

  constructor(
    public row: number,
    public col: number,
    origCellState: CollapsibleCell,
    private sampleFunc: <T>(array: T[]) => T,
  ) {
    this.origCellState = cloneCell(origCellState)
  }

  /**
   *
   * @returns the tile number that was chosen, or undefined if no more tiles are
   * available to choose
   */
  chooseNewTile(): number | undefined {
    if (this.tileChosen !== undefined) {
      this.tilesTried.push(this.tileChosen)
    }
    const remainingTiles = this.origCellState.possibleNumbers.filter((origOption) => {
      return !this.tilesTried.includes(origOption)
    })
    this.tileChosen = this.sampleFunc(remainingTiles)
    return this.tileChosen
  }

  /**
   * @returns true if there are more tiles to sample, false otherwise
   */
  hasMoreTilesToSample() {
    const tileChosenCount = this.tileChosen !== undefined ? 1 : 0
    return this.origCellState.possibleNumbers.length > this.tilesTried.length + tileChosenCount
  }
}

class UndoPropagateStep {
  public prevCellState: CollapsibleCell

  constructor(public row: number, public col: number, prevCellState: CollapsibleCell) {
    // We need to clone the cell state so we can undo
    this.prevCellState = cloneCell(prevCellState)
  }
}

const cloneCell = (cell: CollapsibleCell): CollapsibleCell => ({
  possibleNumbers: _.cloneDeep(cell.possibleNumbers),
  collapsed: cell.collapsed,
})

export const rowColKey = (row: number, col: number) => `${row},${col}`
export const adjCellKeys = (row: number, col: number) => {
  return Object.values(CARDINAL_DIRECTIONS).map(([r, c]) => rowColKey(row + r, col + c))
}
export const adjCellCoords = (row: number, col: number): [number, number][] => {
  return Object.values(CARDINAL_DIRECTIONS).map(([r, c]) => [row + r, col + c])
}
export const adjCellDirAndCoords = (
  row: number,
  col: number,
): [keyof AdjacencyTile, [number, number]][] => {
  return Object.entries(CARDINAL_DIRECTIONS).map(([dir, [r, c]]) => [
    dir as keyof AdjacencyTile,
    [row + r, col + c],
  ])
}
export const adjCellDirAndCoordsInBounds = (
  row: number,
  col: number,
  width: number,
  height: number,
) => {
  return adjCellDirAndCoords(row, col).filter(
    ([_, [r, c]]) => r >= 0 && r < height && c >= 0 && c < width,
  )
}

const arrayEqualsAnyOrder = (a: number[], b: number[]) => {
  return a.length === b.length && a.every((v) => b.includes(v))
}
export class PossibleTilesMap {
  public possibleTiles: CollapsibleCell[][] = []
  private adjacency: Adjacency
  public collapsedCount = 0
  private numCells: number

  constructor(
    private width: number,
    private height: number,
    exampleMap: number[][],
    private sampleFunc: <T>(array: T[]) => T = _.sample,
  ) {
    this.adjacency = new Adjacency(exampleMap)
    this.numCells = this.width * this.height
    this.reset()
  }

  reset() {
    this.collapsedCount = 0
    // initialize possibleTiles so every cell has every possible tile
    this.possibleTiles = []
    const usedTileNumbers = Array.from(this.adjacency.getUsedTileNumbers())
    for (let r = 0; r < this.height; r++) {
      let row: CollapsibleCell[] = []
      for (let c = 0; c < this.width; c++) {
        row.push({
          possibleNumbers: _.cloneDeep(usedTileNumbers),
          collapsed: false, // assume it's not collapsed yet
        })
      }
      this.possibleTiles.push(row)
    }

    const cellsToCheck = new UniqueArray<string>()
    // collapse border tiles since only some tiles can be on the border
    for (let c = 0; c < this.width; c++) {
      // top row
      const upFiltered = this.possibleTiles[0][c].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'up', BORDER_TILE_NUMBER),
      )
      this.updateCellPossibilities(0, c, upFiltered)
      cellsToCheck.push(rowColKey(0, c))
      // bottom row
      const bottomFiltered = this.possibleTiles[this.height - 1][c].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'down', BORDER_TILE_NUMBER),
      )
      this.updateCellPossibilities(this.height - 1, c, bottomFiltered)
      cellsToCheck.push(rowColKey(this.height - 1, c))
    }
    for (let r = 0; r < this.height; r++) {
      // left column
      const leftFiltered = this.possibleTiles[r][0].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'left', BORDER_TILE_NUMBER),
      )
      this.updateCellPossibilities(r, 0, leftFiltered)
      cellsToCheck.push(rowColKey(r, 0))
      // right column
      const rightFiltered = this.possibleTiles[r][this.width - 1].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'right', BORDER_TILE_NUMBER),
      )
      this.updateCellPossibilities(r, this.width - 1, rightFiltered)
      cellsToCheck.push(rowColKey(r, this.width - 1))
    }
    cellsToCheck.toArray().forEach((cellKey) => {
      const coord = cellKey.split(',').map(Number) as [number, number]
      this.propagate(...coord)
    })
  }

  get collapsed() {
    return this.collapsedCount === this.numCells
  }

  print() {
    console.log('Possible Tiles Map')
    for (let r = 0; r < this.height; r++) {
      let row = ''
      for (let c = 0; c < this.width; c++) {
        const cell = this.possibleTiles[r][c]
        row += `[${cell.collapsed ? '' : '?'}${Array.from(cell.possibleNumbers).join(', ')}] `
      }
      console.log(row)
    }
  }

  getCell(row: number, column: number) {
    return this.possibleTiles[row][column]
  }

  /**
   * Get's the [row, column] of the cell with the fewest options.
   * In case of a tie, one will be randomly selected
   */
  getLowestEntropy() {
    return getLowestEntropy(
      this.adjacency,
      this.possibleTiles,
      this.width,
      this.height,
      this.sampleFunc,
    )
  }

  /**
   * Note: possibilities should be an array of unique numbers
   * @param row
   * @param col
   * @param possibilities
   * @returns an UndoStep if cell possibilities were updated, undefined otherwise
   */
  updateCellPossibilities(row: number, col: number, possibilities: number[]) {
    const cell = this.possibleTiles[row][col]
    if (arrayEqualsAnyOrder(possibilities, cell.possibleNumbers)) {
      return undefined
    }
    const undoStep = new UndoPropagateStep(row, col, cell)

    // if the cell was already collapsed but we are undoing it with more than
    // one possibility, then we'll have to decrement the collapsed count
    if (cell.collapsed && possibilities.length > 1) {
      this.collapsedCount--
      cell.collapsed = false
    }

    // if the cell was not collapsed but we are collapsing it, then increment
    // the collapsed count
    if (!cell.collapsed && possibilities.length === 1) {
      cell.collapsed = true
      this.collapsedCount++
    }

    cell.possibleNumbers = possibilities

    return undoStep
  }

  /**
   * Will clean up after itself if it fails to collapse
   * @param state
   * @returns
   */
  collapseOnce(state: RandomSampleState): boolean {
    let propagateSuccess = false

    while (!propagateSuccess) {
      // get one of remaining possible tiles
      const newTile = state.chooseNewTile()
      if (newTile === undefined) {
        // If we've tried all possible tiles, we need undo any propagation
        // we've done and return false
        this.undoRandomSample(state)
        return false
      }

      // Apply the new tile to the cell
      const undoStep = this.updateCellPossibilities(state.row, state.col, [newTile])
      if (undoStep === undefined) {
        // Should never happen
        throw new Error('Cell was not modified')
      }

      const undoStack: UndoPropagateStep[] = [undoStep]

      propagateSuccess = this.propagate(state.row, state.col, undoStack)
      if (!propagateSuccess) {
        // If we can't propagate, we need to undo the propagation, then try
        // a different random sample
        this.undo(undoStack)
      } else {
        // Save the current propagation stack so we can undo it if we need to
        state.undoPropagateStack = undoStack
      }
    }
    return propagateSuccess
  }

  createRandomSampleState(): RandomSampleState {
    const a = this.getLowestEntropy()
    const [row, col] = a
    return new RandomSampleState(row, col, this.getCell(row, col), this.sampleFunc)
  }

  collapse(): number[][] {
    const startTime = Date.now()
    const undoStack: RandomSampleState[] = []
    let popCount = 0

    let state = this.createRandomSampleState()

    while (!this.collapsed) {
      const collapseOnceSucceeded = this.collapseOnce(state)

      if (this.collapsed) {
        break
      }

      if (collapseOnceSucceeded) {
        undoStack.push(state)
        state = this.createRandomSampleState()
      } else {
        // Perfect backtracking ends up being too slow. To backtrack one level,
        // the entire possibility space for that level needs to be searched. To
        // backtrack 2 levels, the entire possibility space of that level times
        // the possibility space of the next levels needs to be searched
        // (i.e exponential growth).
        // The point where the conflict originated might be several levels back
        // so it's much more efficient to jump down more and more levels until
        // we find a level where we can make progress.
        popCount++
        const numToPop = popCount

        for (let i = 0; i < Math.min(numToPop, undoStack.length); i++) {
          state = undoStack.pop()!
          // We need to undo the last propagation before we try a new random
          this.undoRandomSample(state)
        }

        console.log(
          `Undoing last state, Pop count: ${popCount}, Final Undo stack size: ${undoStack.length}, Num to pop: ${numToPop}`,
        )
      }
    }

    console.log('Collapsed in', duration(Date.now() - startTime).asSeconds(), 'sec')
    return this.toNumberArrays()
  }

  /**
   * Only call this after the map has been collapsed
   * @returns a 2D array of numbers representing the collapsed map
   */
  private toNumberArrays() {
    const result = []
    for (let r = 0; r < this.height; r++) {
      const row = []
      for (let c = 0; c < this.width; c++) {
        row.push(this.possibleTiles[r][c].possibleNumbers[0])
      }
      result.push(row)
    }
    return result
  }

  /**
   *
   * Note: This function does not perform any undo operations.
   * @param modifiedRow
   * @param modifiedCol
   * @param undoStack a stack of undo steps that this function will push onto as
   * it makes modifications.
   * @returns true if the propagation was successful, false otherwise
   */
  propagate(
    modifiedRow: number,
    modifiedCol: number,
    undoStack: UndoPropagateStep[] = [],
  ): boolean {
    // Eliminate possibilities for all adjacent cells based on this cell
    const modifiedCell = this.getCell(modifiedRow, modifiedCol)

    return adjCellDirAndCoordsInBounds(modifiedRow, modifiedCol, this.width, this.height).every(
      ([dir, adjCellCoord]) => {
        const adjCell = this.getCell(...adjCellCoord)
        const filteredAdjPossibilities = adjCell.possibleNumbers.filter((possibleTile) => {
          return modifiedCell.possibleNumbers.some((modifiedPossibleNumber) => {
            return this.adjacency.testDirection(possibleTile, opposite(dir), modifiedPossibleNumber)
          })
        })

        if (filteredAdjPossibilities.length === 0) {
          // We've eliminated all possibilities for this cell, return false to
          // backtrack
          return false
        }

        const maybeUndoStep = this.updateCellPossibilities(
          ...adjCellCoord,
          filteredAdjPossibilities,
        )
        if (maybeUndoStep === undefined) {
          // Since nothing was modified, we're done in this direction
          return true
        }

        // If we modified the cell, we need to push it onto the undo stack
        // before we propagate from it
        undoStack.push(maybeUndoStep)

        // If the adj cell was modified, we need to propagate from it
        return this.propagate(...adjCellCoord, undoStack)
      },
    )
  }

  private undo(undoStack: UndoPropagateStep[]) {
    while (undoStack.length > 0) {
      const undoStep = undoStack.pop()!
      this.updateCellPossibilities(
        undoStep.row,
        undoStep.col,
        undoStep.prevCellState.possibleNumbers,
      )
    }
  }

  undoRandomSample(state: RandomSampleState) {
    this.undo(state.undoPropagateStack)
    this.updateCellPossibilities(state.row, state.col, state.origCellState.possibleNumbers)
  }
}

/**
 *
 * @param adjacency
 * @param entropyMap
 * @param width
 * @param height
 * @returns coordinates of the cell with the lowest entropy. If there are ties,
 * one will be randomly selected
 */
export const getLowestEntropy = (
  adjacency: Adjacency,
  entropyMap: CollapsibleCell[][],
  width: number,
  height: number,
  sampleFunc: <T>(array: T[]) => T,
) => {
  // Start w/ the max number of tiles
  let minEntropySoFar = adjacency.getUsedTileNumbers().size
  let lowestCoord: [number, number][] = []
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const cell = entropyMap[r][c]
      if (cell.collapsed) {
        // Don't count if this cell is already collapsed
        continue
      }
      const curEntropy = entropyMap[r][c].possibleNumbers.length
      if (curEntropy === minEntropySoFar) {
        // append for ties
        lowestCoord.push([r, c])
      } else if (curEntropy < minEntropySoFar) {
        // replace if we're lower
        lowestCoord = [[r, c]]
        minEntropySoFar = curEntropy
      }
    }
  }

  if (lowestCoord.length === 0) {
    throw new Error('No lowest entropy')
  }
  return sampleFunc(lowestCoord)!
}
