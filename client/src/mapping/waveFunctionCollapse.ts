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

export const rowColKey = (row: number, col: number) => `${row},${col}`
export const adjCellCoordinates = (row: number, col: number) => {
  return Object.values(CARDINAL_DIRECTIONS).map(([r, c]) => rowColKey(row + r, col + c))
}

export class PossibleTilesMap {
  public possibleTiles: CollapsibleCell[][] = []
  private adjacency: Adjacency
  private collapsedCount = 0
  private numCells: number

  constructor(private width: number, private height: number, exampleMap: number[][]) {
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
      cellsToCheck.push(rowColKey(1, c)) // optimization: add row below, since they are adjacent
      // bottom row
      const bottomFiltered = this.possibleTiles[this.height - 1][c].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'down', BORDER_TILE_NUMBER),
      )
      this.updateCellPossibilities(this.height - 1, c, bottomFiltered)
      cellsToCheck.push(rowColKey(this.height - 1, c))
      cellsToCheck.push(rowColKey(this.height - 2, c)) // optimization: add row above, since they are adjacent
    }
    for (let r = 0; r < this.height; r++) {
      // left column
      const leftFiltered = this.possibleTiles[r][0].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'left', BORDER_TILE_NUMBER),
      )
      this.updateCellPossibilities(r, 0, leftFiltered)
      cellsToCheck.push(rowColKey(r, 0))
      cellsToCheck.push(rowColKey(r, 1)) // optimization: add row to the right, since they are adjacent
      // right column
      const rightFiltered = this.possibleTiles[r][this.width - 1].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'right', BORDER_TILE_NUMBER),
      )
      this.updateCellPossibilities(r, this.width - 1, rightFiltered)
      cellsToCheck.push(rowColKey(r, this.width - 1))
      cellsToCheck.push(rowColKey(r, this.width - 2)) // optimization: add row to the left, since they are adjacent
    }
    this.propagate(new Set<string>(), cellsToCheck)
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

  getPossibleTiles(row: number, column: number) {
    return this.possibleTiles[row][column]
  }

  /**
   * Get's the [row, column] of the cell with the fewest options.
   * In case of a tie, one will be randomly selected
   */
  getLowestEntropy() {
    return getLowestEntropy(this.adjacency, this.possibleTiles, this.width, this.height)
  }

  /**
   * Note: possibilities should be an array of unique numbers
   * @param row
   * @param col
   * @param possibilities
   * @returns true if the cell possibilities were updated
   */
  updateCellPossibilities(row: number, col: number, possibilities: number[]) {
    const cell = this.possibleTiles[row][col]
    if (possibilities.length === cell.possibleNumbers.length) {
      return false
    }
    cell.possibleNumbers = possibilities
    if (cell.possibleNumbers.length === 1) {
      cell.collapsed = true
      this.collapsedCount++
    }
    return true
  }

  collapse() {
    const startTime = Date.now()
    let iterations = 0
    while (!this.collapsed) {
      try {
        const modifiedCells = new Set<string>()
        while (!this.collapsed) {
          const coordToCollapse = this.getLowestEntropy()
          // console.log('Collapsing', coordToCollapse)
          if (coordToCollapse === undefined) {
            throw new Error('Unable to collapse. No lowest entropy coord')
          }
          const collapsedTileNum = _.sample(
            Array.from(this.getPossibleTiles(...coordToCollapse).possibleNumbers),
          )
          if (collapsedTileNum === undefined) {
            throw new Error(`Unable to collapse coord ${coordToCollapse}. No possible options`)
          }

          const updated = this.updateCellPossibilities(...coordToCollapse, [collapsedTileNum])
          if (updated) {
            modifiedCells.add(rowColKey(...coordToCollapse))
            this.propagate(modifiedCells, new UniqueArray(adjCellCoordinates(...coordToCollapse)))
          }
        }

        console.log('Collapsed in', duration(Date.now() - startTime).asSeconds(), 'sec')
        return this.toNumberArrays()
      } catch (e) {
        console.warn(`Error collapsing. Iteration=${iterations}`, e)
        this.reset()
        iterations++
      }
    }
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

  propagate(modifiedCells: Set<string>, cellsToCheck: UniqueArray<string>) {
    // collapse cells to check
    while (cellsToCheck.length > 0) {
      const [row, col] = cellsToCheck.shift()!.split(',').map(Number)
      // console.log('Checking', row, col)
      const updated = this.testCellPossibilities(row, col, modifiedCells)
      if (updated) {
        // console.log('Updated', row, col)
        // Add neighbor cells to check
        adjCellCoordinates(row, col).forEach((adjRowColKey) => {
          cellsToCheck.push(adjRowColKey)
        })
      }
    }
  }

  /**
   * Returns true if the cell at the provided row and column can have the
   * provided number in the provided direction. If the cell is on the border,
   * it will always return true.
   */
  supportsNumberInDirection(row: number, col: number, num: number, direction: keyof AdjacencyTile) {
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      return true
    }
    const cell = this.possibleTiles[row][col]
    return Array.from(cell.possibleNumbers).some((possibleNum) => {
      return this.adjacency.testDirection(possibleNum, direction, num)
    })
  }

  /**
   * Tests all possible numbers for a cell against adjacent cells that are in
   * the modifiedCells set. If the possibilities are reduced, the cell is added
   * to the modifiedCells set.
   * @param row
   * @param col
   * @param modifiedCells
   * @returns true if the cell possibilities was modified
   */
  testCellPossibilities(row: number, col: number, modifiedCells: Set<string>) {
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      return false
    }
    const cell = this.possibleTiles[row][col]
    if (cell.collapsed) {
      return false
    }
    // for each possible number, check if all 4 directions support it
    const newPossibleNums = cell.possibleNumbers.filter((num) => {
      return Object.entries(CARDINAL_DIRECTIONS).every(([direction, vector]) => {
        return this.supportsNumberInDirection(
          row + vector[0],
          col + vector[1],
          num,
          opposite(direction as keyof AdjacencyTile),
        )
      })
    })

    const updated = this.updateCellPossibilities(row, col, newPossibleNums)
    if (!updated) {
      return false
    }

    modifiedCells.add(rowColKey(row, col))
    // If we've collapsed to one possibility, mark as collapsed
    if (cell.possibleNumbers.length === 1) {
      cell.collapsed = true
    }
    // If we've collapsed to zero possibilities, we can't continue
    if (cell.possibleNumbers.length === 0) {
      // this.print()
      console.error(`No possible numbers for cell ${row}, ${col}`)
      throw new Error('No possible numbers')
    }

    return true
  }
}

export const getLowestEntropy = (
  adjacency: Adjacency,
  entropyMap: CollapsibleCell[][],
  width: number,
  height: number,
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
  return _.sample(lowestCoord)
}
