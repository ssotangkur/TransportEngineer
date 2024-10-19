import { addComponent, addEntity, defineQuery, IWorld, removeEntity } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { MapWorld } from './mapSystem'
import { SingletonWorld } from './singletonSystem'
import { CHUNK_SIZE } from 'src/constants'
import _ from 'lodash'
import { ChunkComponent } from 'src/components/chunkComponent'
import { MapInfo } from 'src/utils/mapInfo'
import { Events } from 'src/events/events'

const chunkQuery = defineQuery([ChunkComponent])

export type ChunkInfo = {
  getChunkForWorldPosition: (x: number, y: number) => Phaser.Math.Vector2
  chunkKey: (x: number, y: number) => string
}

export type ChunkWorld = {
  chunkSystem: {
    chunkInfo: ChunkInfo
  }
}

/**
 * Monitors the camera's view and creates or removes chunk entities based on what is visible
 * on screen.
 */
export class ChunkVisibilitySystem<WorldIn extends MapWorld & SingletonWorld> extends BaseSystem<
  MapWorld & SingletonWorld,
  WorldIn,
  ChunkWorld
> {
  public prevCameraRect: Phaser.Geom.Rectangle | undefined

  createWorld(_: MapWorld & SingletonWorld): ChunkWorld {
    return {
      chunkSystem: {
        chunkInfo: {
          getChunkForWorldPosition: () => {
            throw new Error(`Initialize TilesetInfo before calling this.`)
          },
          chunkKey: (x: number, y: number) => {
            return `${x},${y}`
          },
        },
      },
    }
  }

  create(): void {
    // Update functions when mapinfo changes
    this.subUnsub('mapInfoUpdated', (mapInfo) => {
      this.onMapInfoUpdated(mapInfo)
    })
  }

  onMapInfoUpdated(mapInfo: MapInfo) {
    this.world.chunkSystem.chunkInfo.getChunkForWorldPosition = (x: number, y: number) => {
      const chunkX = Math.floor(x / (CHUNK_SIZE * mapInfo.tileSetInfo!.tileWidth))
      const chunkY = Math.floor(y / (CHUNK_SIZE * mapInfo.tileSetInfo!.tileHeight))
      return new Phaser.Math.Vector2(chunkX, chunkY)
    }
    Events.emit('chunkInfoUpdated', this.world.chunkSystem.chunkInfo)
  }

  update(_time: number, _delta: number): void {
    const cameraRect = this.scene.cameras.main.worldView
    const cameraViewChanged = !_.isEqual(this.prevCameraRect, cameraRect)

    const tileSetInfo = this.world.mapSystem.tileSetInfo
    if (!cameraViewChanged || !tileSetInfo) {
      return // No need to update
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
