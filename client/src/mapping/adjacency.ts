export type AdjacencyTile = {
  up: Set<number>
  down: Set<number>
  left: Set<number>
  right: Set<number>
}

export const BORDER_TILE_NUMBER = -1
export const CARDINAL_DIRECTIONS: Record<keyof AdjacencyTile, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
} as const

export const opposite = (direction: keyof AdjacencyTile): keyof AdjacencyTile => {
  switch (direction) {
    case 'up':
      return 'down'
    case 'down':
      return 'up'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
  }
}

export class Adjacency {
  private adjacencyTileMap: Map<number, AdjacencyTile>
  private usedTileNumbers: Set<number>
  height: number
  width: number
  constructor(exampleMap: number[][]) {
    this.height = exampleMap.length
    this.width = exampleMap.length ? exampleMap[0].length : 0
    this.adjacencyTileMap = new Map()
    this.usedTileNumbers = new Set()

    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const tileNum = exampleMap[row][col]
        this.usedTileNumbers.add(tileNum)
        let adjTile = this.adjacencyTileMap.get(tileNum)
        if (!adjTile) {
          adjTile = {
            up: new Set(),
            down: new Set(),
            left: new Set(),
            right: new Set(),
          }
          this.adjacencyTileMap.set(exampleMap[row][col], adjTile)
        }

        // For each cardinal direction, add the adjacent tile number
        for (const [dir, vector] of Object.entries(CARDINAL_DIRECTIONS)) {
          adjTile[dir as keyof AdjacencyTile].add(
            this.getAdjacentTile(exampleMap, row, col, vector),
          )
        }
      }
    }
  }

  print() {
    for (const [tileNum, adjTile] of this.adjacencyTileMap.entries()) {
      console.log(`Tile ${tileNum}`)
      console.log(` Up: ${Array.from(adjTile.up).join(', ')}`)
      console.log(` Down: ${Array.from(adjTile.down).join(', ')}`)
      console.log(` Left: ${Array.from(adjTile.left).join(', ')}`)
      console.log(` Right: ${Array.from(adjTile.right).join(', ')}`)
    }
  }

  getAdjacencyTile(tileNum: number) {
    return this.adjacencyTileMap.get(tileNum)
  }

  /**
   * Tests whether the provided tileNumber can be adjacent to the testTileNum in the provided direction
   */
  testDirection(tileNum: number, direction: keyof AdjacencyTile, testTileNum: number) {
    const adjTile = this.getAdjacencyTile(tileNum)
    if (!adjTile) {
      return false
    }
    return adjTile[direction].has(testTileNum)
  }

  /**
   * Returns set of all unique tile numbers provided in the example map
   */
  getUsedTileNumbers() {
    return this.usedTileNumbers
  }

  private getAdjacentTile(
    exampleMap: number[][],
    row: number,
    col: number,
    direction: [number, number],
  ) {
    const adjRow = row + direction[0]
    const adjCol = col + direction[1]
    const inBounds = adjRow >= 0 && adjRow < this.height && adjCol >= 0 && adjCol < this.width
    return inBounds ? exampleMap[adjRow][adjCol] : BORDER_TILE_NUMBER
  }
}
