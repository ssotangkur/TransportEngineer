import { addComponent, addEntity, defineQuery, IWorld, removeEntity } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { MapWorld } from './mapSystem'
import { SingletonWorld } from './singletonSystem'
import { CHUNK_SIZE } from 'src/constants'
import _ from 'lodash'
import { ChunkComponent } from 'src/components/chunkComponent'
import { Events } from 'src/events/events'
import { AABB, transformWorldAABBToTile } from 'src/utils/aabb'

const chunkQuery = defineQuery([ChunkComponent])

/**
 * Monitors the camera's view and creates or removes chunk entities based on what is visible
 * on screen.
 */
export class ChunkVisibilitySystem<WorldIn extends MapWorld & SingletonWorld> extends BaseSystem<
  MapWorld & SingletonWorld,
  WorldIn,
  IWorld
> {
  public prevCameraRect: Phaser.Geom.Rectangle | undefined

  private refreshAll = false

  createWorld(_: MapWorld & SingletonWorld): IWorld {
    return {}
  }

  create(): void {
    // When map is regenerated, we can trigger all downstream systems
    // to regenerate chunks by removing and re-adding them
    this.subUnsub('mapRegenerated', () => {
      this.refreshAll = true
    })
  }

  update(_time: number, _delta: number): void {
    const cameraRect = this.scene.cameras.main.worldView
    const cameraViewChanged = !_.isEqual(this.prevCameraRect, cameraRect)

    const tileSetInfo = this.world.mapSystem.tileSetInfo
    if (!tileSetInfo || (!cameraViewChanged && !this.refreshAll)) {
      return // No need to update
    }

    if (this.world.mapSystem.colorMap) {
      // Get rect for mini map in tile units
      const rect = new AABB(cameraRect.x, cameraRect.y, cameraRect.width, cameraRect.height)
      transformWorldAABBToTile(rect, this.world.mapSystem.mapInfo)
      Events.emit('miniMapUpdated', {
        colorMap: this.world.mapSystem.colorMap,
        rect,
      })
    }

    // Update state for next frame
    this.prevCameraRect = _.cloneDeep(cameraRect)

    // Find which chunks are currently visible
    const tileWidth = tileSetInfo.tileWidth
    const tileHeight = tileSetInfo.tileHeight

    const topLeftChunk = getChunkForWorldPosition(cameraRect.x, cameraRect.y, tileWidth, tileHeight)
    const bottomRightChunk = getChunkForWorldPosition(
      cameraRect.x + cameraRect.width,
      cameraRect.y + cameraRect.height,
      tileWidth,
      tileHeight,
    )

    // Initialize to all visible chunks, then we'll remove chunks that are already displayed
    const chunksToAdd: Set<string> = new Set()
    for (let x = topLeftChunk.x; x <= bottomRightChunk.x; x++) {
      for (let y = topLeftChunk.y; y <= bottomRightChunk.y; y++) {
        chunksToAdd.add(chunkKey(x, y))
      }
    }

    const visibleChunkRect = new Phaser.Geom.Rectangle(
      topLeftChunk.x,
      topLeftChunk.y,
      bottomRightChunk.x - topLeftChunk.x,
      bottomRightChunk.y - topLeftChunk.y,
    )

    this.forEidIn(chunkQuery, (eid) => {
      const chunkX = ChunkComponent.x[eid]
      const chunkY = ChunkComponent.y[eid]

      // If refreshAll is true, all chunks will be removed
      // They will get re-added at the end
      if (this.refreshAll) {
        this.debug(`(refreshAll) Removing chunk ${chunkKey(chunkX, chunkY)}`)
        removeEntity(this.world, eid)
        return
      }

      // Remove chunks that are no longer visible
      if (!visibleChunkRect.contains(chunkX, chunkY)) {
        this.debug(`Removing chunk ${chunkKey(chunkX, chunkY)}`)
        removeEntity(this.world, eid)
        return
      }

      // Chunks that are already being rendered, need not be added again
      chunksToAdd.delete(chunkKey(chunkX, chunkY))
    })

    // Add new chunks
    chunksToAdd.forEach((key) => {
      this.debug(`Adding chunk ${key}`)
      const [x, y] = key.split(',').map(Number)
      const eid = addEntity(this.world)
      addComponent(this.world, ChunkComponent, eid)
      ChunkComponent.x[eid] = x
      ChunkComponent.y[eid] = y
    })

    // Reset refreshAll flag
    this.refreshAll = false
  }
}

export const getChunkForWorldPosition = (
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number,
): Phaser.Math.Vector2 => {
  const chunkX = Math.floor(x / (CHUNK_SIZE * tileWidth))
  const chunkY = Math.floor(y / (CHUNK_SIZE * tileHeight))
  return new Phaser.Math.Vector2(chunkX, chunkY)
}

export const chunkKey = (x: number, y: number) => `${x},${y}`
