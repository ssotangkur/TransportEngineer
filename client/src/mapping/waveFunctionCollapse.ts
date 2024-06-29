import {
  Adjacency,
  AdjacencyTile,
  BORDER_TILE_NUMBER,
  CARDINAL_DIRECTIONS,
  opposite,
} from './adjacency'
import _ from 'lodash'

export type CollapsibleCell = {
  possibleNumbers: number[]
  collapsed: boolean
}

export const rowColKey = (row: number, col: number) => `${row},${col}`
export const adjCellCoordinates = (row: number, col: number) => {
  return Object.values(CARDINAL_DIRECTIONS).map(([r, c]) => rowColKey(row + r, col + c))
}

export class PossibleTilesMap {
  public possibleTiles: CollapsibleCell[][]
  private adjacency: Adjacency

  constructor(private width: number, private height: number, exampleMap: number[][]) {
    this.adjacency = new Adjacency(exampleMap)

    // initialize possibleTiles so every cell has every possible tile
    this.possibleTiles = []
    const usedTileNumbers = Array.from(this.adjacency.getUsedTileNumbers())
    for (let r = 0; r < this.height; r++) {
      let row: CollapsibleCell[] = []
      for (let c = 0; c < this.width; c++) {
        row.push({
          possibleNumbers: _.cloneDeep(usedTileNumbers),
          collapsed: usedTileNumbers.length === 1,
        })
      }
      this.possibleTiles.push(row)
    }

    // collapse border tiles since only some tiles can be on the border
    for (let c = 0; c < this.width; c++) {
      // top row
      this.possibleTiles[0][c].possibleNumbers = this.possibleTiles[0][c].possibleNumbers.filter(
        (num) => this.adjacency.testDirection(num, 'up', BORDER_TILE_NUMBER),
      )
      // bottom row
      this.possibleTiles[this.height - 1][c].possibleNumbers = this.possibleTiles[this.height - 1][
        c
      ].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'down', BORDER_TILE_NUMBER),
      )
    }
    for (let r = 0; r < this.height; r++) {
      // left column
      this.possibleTiles[r][0].possibleNumbers = this.possibleTiles[r][0].possibleNumbers.filter(
        (num) => this.adjacency.testDirection(num, 'left', BORDER_TILE_NUMBER),
      )
      // right column
      this.possibleTiles[r][this.width - 1].possibleNumbers = this.possibleTiles[r][
        this.width - 1
      ].possibleNumbers.filter((num) =>
        this.adjacency.testDirection(num, 'right', BORDER_TILE_NUMBER),
      )
    }
  }

  collapsed() {
    return this.possibleTiles.every((row) => row.every((cell) => cell.collapsed))
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

  propagate(modifiedCells: Set<string>, cellsToCheck: string[] = []) {
    // const coordToCollapse = this.getLowestEntropy()
    // if (coordToCollapse === undefined) {
    //   console.error('Unable to collapse. No lowest entropy coord')
    //   return
    // }
    // const collapsedTileNum = _.sample(
    //   Array.from(this.getPossibleTiles(...coordToCollapse).possibleNumbers),
    // )
    // if (collapsedTileNum === undefined) {
    //   console.error(`Unable to collapse coord ${coordToCollapse}. No possible options`)
    //   return
    // }

    // const cell = this.possibleTiles[coordToCollapse[0]][coordToCollapse[1]]
    // cell.possibleNumbers.clear()
    // cell.possibleNumbers.add(collapsedTileNum)
    // cell.collapsedValue = collapsedTileNum
    // modifiedCells.add(rowColKey(...coordToCollapse))

    // // Add neighbor cells to check
    // for (const vector of Object.values(CARDINAL_DIRECTIONS)) {
    //   const adjRow = coordToCollapse[0] + vector[0]
    //   const adjCol = coordToCollapse[1] + vector[1]
    //   const adjRowColKey = rowColKey(adjRow, adjCol)
    //   if (!modifiedCells.has(adjRowColKey)) {
    //     cellsToCheck.push(adjRowColKey)
    //     console.log('Adding to check', adjRowColKey)
    //   }
    // }

    // collapse cells to check
    while (cellsToCheck.length > 0) {
      const [row, col] = cellsToCheck.shift()!.split(',').map(Number)
      console.log('Checking', row, col)
      const updated = this.updateCellPossibilities(row, col, modifiedCells)
      if (updated) {
        console.log('Updated', row, col)
        // Add neighbor cells to check
        adjCellCoordinates(row, col).forEach((adjRowColKey) => {
          if (!modifiedCells.has(adjRowColKey)) {
            cellsToCheck.push(adjRowColKey)
            console.log('Adding to check2', adjRowColKey)
          }
        })
      }
    }
    // for (const [direction, vector] of Object.entries(CARDINAL_DIRECTIONS)) {
    //   const dir = direction as keyof AdjacencyTile
    //   const adjRow = coordToCollapse[0] + vector[0]
    //   const adjCol = coordToCollapse[1] + vector[1]

    //   const adjCellWasUpdated = this.updateCellPossibilities(adjRow, adjCol, modifiedCells)
    //   // Don't add cells that were already modified to the ones we need to check
    //   if (adjCellWasUpdated && !modifiedCells.has(rowColKey(adjRow, adjCol))) {
    //     cellsToCheck.push(rowColKey(adjRow, adjCol))
    //   }

    //   const adjCell = this.possibleTiles[adjRow][adjCol]
    //   // Check for each possible number in the adjacent cell whether that tile
    //   // is allowed to have the collapsed tile in the direction opposite of the
    //   // adjacent cell.
    //   Array.from(adjCell.possibleNumbers.values()).forEach((num) => {
    //     if (!this.adjacency.testDirection(num, opposite(dir), collapsedTileNum)) {
    //       adjCell.possibleNumbers.delete(num)
    //       modifiedCells.add(rowColKey(adjRow, adjCol))
    //     }
    //   })
    // }
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
  updateCellPossibilities(row: number, col: number, modifiedCells: Set<string>) {
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      return false
    }
    const cell = this.possibleTiles[row][col]
    if (cell.collapsed) {
      return false
    }
    // for each possible number, check if all 4 directions support it
    const newPossibleNums = Array.from(cell.possibleNumbers).filter((num) => {
      return Object.entries(CARDINAL_DIRECTIONS).every(([direction, vector]) => {
        return this.supportsNumberInDirection(
          row + vector[0],
          col + vector[1],
          num,
          opposite(direction as keyof AdjacencyTile),
        )
      })
    })
    if (newPossibleNums.length === cell.possibleNumbers.length) {
      // Same possibilities, no need to update
      return false
    }
    // Different lengths means we need to update
    cell.possibleNumbers = newPossibleNums
    modifiedCells.add(rowColKey(row, col))
    // If we've collapsed to one possibility, mark as collapsed
    if (cell.possibleNumbers.length === 1) {
      cell.collapsed = true
    }
    // If we've collapsed to zero possibilities, we can't continue
    if (cell.possibleNumbers.length === 0) {
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
