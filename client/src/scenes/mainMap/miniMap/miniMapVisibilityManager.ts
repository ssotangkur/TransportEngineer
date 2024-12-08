import { ColorMapper } from 'src/mapping/mapGenerator'
import { AABB } from 'src/utils/aabb'

export type MiniMapVisibilityCallback = (
  newlyVisibleTiles: string[],
  newlyHiddenTiles: string[],
  colorMap: ColorMapper,
) => void

export class MiniMapVisibilityManager {
  private currentChunkAABB: AABB | undefined // In chunk units
  private subscribers: MiniMapVisibilityCallback[] = []

  /**
   *
   * @param tileSize The size of our minimap tile (not the size of the world tile)
   */
  constructor(public miniMapTileSize: number) {}

  /**
   * Adds a callback function to be invoked whenever there is a change in visibility of tiles.
   * @param callback A function thatreceives two arrays: one for newly visible tiles and one for newly hidden tiles.
   * @returns a function that can be called to unsubscribe the callback
   */
  subscribe(callback: MiniMapVisibilityCallback) {
    this.subscribers.push(callback)
    const unsubscribe = () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback)
    }
    return unsubscribe
  }

  /**
   * Call this to update what is now visible
   * @param newVisibleAABB in tile units
   * @param colorMap provides the color of each tile, passed through to subscribers
   */
  updateVisibility(newVisibleAABB: AABB, colorMap: ColorMapper) {
    const toChunk = (n: number) => Math.floor(n / this.miniMapTileSize)
    const newChunkAABB = newVisibleAABB.clone()
    newChunkAABB.transform(toChunk, toChunk)

    // Find all the tiles that are in newVisibleAABB, but not in currentChunkAABB
    const newlyVisibleTiles: string[] = []
    newChunkAABB.forEach((x, y) => {
      const found = this.currentChunkAABB?.containsInclusive(x, y) ?? false
      if (!found) {
        const key = this.getChunkKey(x, y)
        newlyVisibleTiles.push(key)
      }
    })

    // Now find all the tiles that are in currentChunkAABB, but not in newVisibleAABB
    const newlyHiddenTiles: string[] = []
    this.currentChunkAABB?.forEach((x, y) => {
      if (!newChunkAABB.containsInclusive(x, y)) {
        const key = this.getChunkKey(x, y)
        newlyHiddenTiles.push(key)
      }
    })

    this.currentChunkAABB = newChunkAABB

    this.notifyAll(newlyVisibleTiles, newlyHiddenTiles, colorMap)
  }

  private notifyAll(
    newlyVisibleTiles: string[],
    newlyHiddenTiles: string[],
    colorMap: ColorMapper,
  ) {
    this.subscribers.forEach((s) => s(newlyVisibleTiles, newlyHiddenTiles, colorMap))
  }

  private getChunkKey(x: number, y: number) {
    return `${x},${y}`
  }
}
